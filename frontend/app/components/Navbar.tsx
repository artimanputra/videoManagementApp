"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function Navbar() {
  const [isAuthed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      setAuthed(!!localStorage.getItem("token"));
    } catch {
      setAuthed(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {}
    setAuthed(false);
    router.replace("/");
  }, [router]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-black/30 border-b border-[#1f1f1f]">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo2.png"   
            alt="SplitStudio"
            width={72}
            height={72}
            priority
          />
          <span className="text-lg font-semibold text-white w-">
            SplitStudio
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <a href="#demo" className="hover:text-white">Demo</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthed ? (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700"
              >
                Try it free →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/videos/create"
                className="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700"
              >
                Upload a Video
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm rounded bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a]"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}