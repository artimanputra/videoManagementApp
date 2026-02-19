## Video Management Application
- A full‑stack Video Management System consisting of:

### Backend – FastAPI, PostgreSQL, Async operations, FFmpeg-based video processing
### Frontend – Next.js application for managing videos, uploads, segmentation, and metadata
### Automated Test Cases – Documented test scenarios for backend APIs


📂 Project Structure
```bash
videoManagementApp/
│
├── backend/        → FastAPI backend source code
│   ├── README.md   → Backend setup & API instructions
│   └── TESTING.md  → Test case documentation
│
└── frontend/       → Next.js frontend application
    └── README.md   → Frontend setup & usage instructions
```

### 🔗 Repository
You can access the full project here:
https://github.com/artimanputra/videoManagementApp

### 🔗Project Link
You can view the project here 
https://video-management-app-gamma.vercel.app/

### 📘 Documentation Overview
For ease of review, project documentation has been organized as follows:
#### 📌 Backend Instructions
Located in:
backend/README.md

Includes:

Environment setup
Virtual environment creation
PostgreSQL configuration
FFmpeg installation
Running the FastAPI server
Full API endpoint list


#### 🧪 Test Case Instructions
Located in:
backend/TESTING.md

Includes:

API test scenarios
Input/Output expectations
Edge cases and validations
Workflow coverage for video upload, split, list, update


#### 🎨 Frontend Instructions
Located in:
frontend/README.md

Includes:

Node module installation
Environment variable setup
Running the Next.js application
Page-by-page functional description

Dashboard / Video List
Upload Video
Video Detail & Segmentation
Edit Video Page


#### ▶️ Quick Start Summary
Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # or Windows equivalent
pip install -r requirements.txt
cp .env.example .env
# update DATABASE_URL
python -m uvicorn app.main:app --reload
```
Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

🙋‍♂️ Need Help?

Each directory contains its own detailed README for setup and usage.

