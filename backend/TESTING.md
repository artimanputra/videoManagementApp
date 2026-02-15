# Backend Testing Guide

This document explains how to run the comprehensive test suite for the video management backend.

## Installation

Install testing dependencies:

```bash
pip install -r requirements.txt
```

The following testing packages will be installed:
- `pytest` - Test framework
- `pytest-asyncio` - Async test support
- `httpx` - Async HTTP client for testing

## Running Tests

### Run all tests
```bash
pytest
```

### Run with verbose output
```bash
pytest -v
```

### Run specific test file
```bash
pytest test_main.py
```

### Run specific test class
```bash
pytest test_main.py::TestVideoEndpoints
```

### Run specific test
```bash
pytest test_main.py::TestVideoEndpoints::test_create_video_success
```

### Run with coverage report
```bash
pip install pytest-cov
pytest --cov=app --cov-report=html
```

### Run only async tests
```bash
pytest -m asyncio
```

### Run with detailed output
```bash
pytest -vv --tb=long
```

## Test Structure

### conftest.py
- `event_loop` - Creates event loop for async tests
- `db_engine` - Creates test database (in-memory SQLite)
- `db_session` - Creates database session for each test
- `client` - Creates FastAPI test client with dependency overrides
- `sample_video_file` - Creates minimal MP4 file for testing

### test_main.py
Contains three test classes:

#### TestVideoEndpoints
Tests all API endpoints:
- **Create video**: Success, minimal fields, validation errors, missing fields
- **List videos**: Empty, pagination, search, status filtering, invalid pagination
- **Get video**: Success, with segments, not found errors
- **Update video**: Title, description, status, multiple fields, not found, no changes
- **Split video**: Validation, not found errors

#### TestVideoModels
Tests database models:
- Video creation
- Video-Segment relationships
- Cascade delete behavior
- Default status values

#### TestVideoSchemas
Tests Pydantic validation schemas:
- VideoCreate schema
- VideoOut schema
- Required field validation

## Test Coverage

Current test suite covers:
- ✅ All 5 main endpoints (POST, GET list, GET detail, PATCH, POST split)
- ✅ CRUD operations
- ✅ Pagination and filtering
- ✅ Relationship management
- ✅ Validation and error handling
- ✅ Database models
- ✅ Pydantic schemas
- ✅ Edge cases and error conditions

## Example Output

```
test_main.py::TestVideoEndpoints::test_create_video_success PASSED
test_main.py::TestVideoEndpoints::test_create_video_minimal PASSED
test_main.py::TestVideoEndpoints::test_create_video_missing_title PASSED
test_main.py::TestVideoEndpoints::test_list_videos_empty PASSED
test_main.py::TestVideoEndpoints::test_list_videos_pagination PASSED
test_main.py::TestVideoEndpoints::test_get_video_success PASSED
test_main.py::TestVideoEndpoints::test_update_video_title PASSED
test_main.py::TestVideoModels::test_video_creation PASSED
test_main.py::TestVideoSchemas::test_video_create_schema PASSED

===================== 50 passed in 2.34s =====================
```

## Debugging Tests

### Print debug info in tests
```python
def test_something(client):
    response = client.get("/videos")
    print(response.json())  # Will show in pytest output with -s
    assert response.status_code == 200
```

### Run with print statements visible
```bash
pytest -s
```

### Run with Python debugger
```bash
pytest --pdb
```
This drops you into pdb on test failure.

### Run with detailed traceback
```bash
pytest --tb=long -v
```

## Notes

- Tests use **in-memory SQLite** database, not PostgreSQL
- Each test gets a **fresh database** (no test pollution)
- **Async tests** are automatically detected and handled
- **File uploads** use minimal MP4 stubs for speed
- Database **relationships are tested** (lazy loading, cascade delete)

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=app --cov-report=xml
```

## Extending Tests

To add new tests:

1. Create test function in appropriate class
2. Use async/await for database operations
3. Use `client` fixture for HTTP requests
4. Use `db_session` fixture for direct DB access
5. Follow naming convention: `test_<feature>_<scenario>`

Example:
```python
@pytest.mark.asyncio
async def test_new_feature(client, db_session):
    # Setup
    video = Video(title="Test", video_url="/test.mp4", status="Draft")
    db_session.add(video)
    await db_session.commit()
    
    # Test
    response = await client.get(f"/videos/{video.id}")
    
    # Assert
    assert response.status_code == 200
    assert response.json()["title"] == "Test"
```

## Troubleshooting

**Import errors**: Make sure you're in the backend directory and installed all dependencies
**Async errors**: Ensure pytest-asyncio is installed and asyncio_mode = auto is set in pytest.ini
**Database errors**: Tests use in-memory SQLite, so database URL doesn't matter
**Timeout errors**: Increase the timeout with `pytest --timeout=10`
