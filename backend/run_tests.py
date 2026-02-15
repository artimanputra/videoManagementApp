#!/usr/bin/env python
"""
Convenient test runner script for the video management backend.
Usage: python run_tests.py [options]
"""

import subprocess
import sys
import argparse


def run_command(cmd, description=""):
    """Run a shell command and handle errors."""
    if description:
        print(f"\n{'='*60}")
        print(f"  {description}")
        print(f"{'='*60}\n")
    
    result = subprocess.run(cmd, shell=True)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Run backend tests")
    parser.add_argument(
        "--coverage",
        action="store_true",
        help="Run tests with coverage report"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "--file",
        help="Run specific test file (e.g., test_main.py)"
    )
    parser.add_argument(
        "--test",
        help="Run specific test (e.g., TestVideoEndpoints::test_create_video_success)"
    )
    parser.add_argument(
        "--markers", "-m",
        help="Run tests matching marker (e.g., asyncio)"
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Install test dependencies from requirements.txt"
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="Run fast tests only (exclude slow tests)"
    )
    
    args = parser.parse_args()
    
    # Install dependencies if requested
    if args.install:
        success = run_command(
            "pip install -r requirements.txt",
            "Installing dependencies..."
        )
        if not success:
            print("Failed to install dependencies")
            return 1
    
    # Build pytest command
    cmd = "pytest"
    
    if args.file:
        cmd += f" {args.file}"
    
    if args.test:
        cmd += f" {args.test}"
    
    if args.markers:
        cmd += f" -m {args.markers}"
    
    if args.verbose:
        cmd += " -v"
    
    if args.coverage:
        cmd += " --cov=app --cov-report=html --cov-report=term-missing"
    
    # Run tests
    success = run_command(cmd, "Running tests...")
    
    if args.coverage and success:
        print("\n✅ Coverage report generated in htmlcov/index.html")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
