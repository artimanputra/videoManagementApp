# Video Management Backend

A FastAPI-based video management system with PostgreSQL, async operations, and video processing capabilities.

## Setup Instructions

### Prerequisites
- Python 3.9+
- PostgreSQL 
- FFmpeg (for video splitting)

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows (PowerShell):
     ```bash
     .\venv\Scripts\Activate.ps1
     ```
   - Windows (CMD):
     ```bash
     venv\Scripts\activate.bat
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your database URL:
   ```
   DATABASE_URL=postgresql+asyncpg://username:password@host:port/database
   ```

   **Example with Neon:**
   - Sign up at [neon.tech](https://neon.tech)
   - Copy your connection string and paste it in `.env`

6. **Install FFmpeg** (required for video splitting)
   - **Windows (Chocolatey):**
     ```bash
     choco install ffmpeg
     ```
   - **Windows (Winget):**
     ```bash
     winget install ffmpeg
     ```
   - **macOS:**
     ```bash
     brew install ffmpeg
     ```
   - **Linux:**
     ```bash
     sudo apt-get install ffmpeg
     ```

7. **Run the server**
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   Server will be available at `http://localhost:8000`

## API Endpoints

### Videos
- `POST /videos` - Create video (upload file)
- `GET /videos` - List videos (with pagination, search, filtering)
- `GET /videos/{id}` - Get video details
- `PATCH /videos/{id}` - Update video
- `POST /videos/{id}/split` - Split video into segments

### Query Parameters (GET /videos)
- `page`: Page number (default: 1)
- `size`: Items per page (default: 10, max: 100)
- `search`: Search by title
- `status`: Filter by status (Uploading, Draft, Processing, Ready, Failed)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |

## Video Status Flow

 - File is being uploaded
2. **Draft** - Video uploaded, ready for editing
3. **Processing** - Video segments are being created
4. **Ready** - Segments ready
5. **Failed** - Error during processing


