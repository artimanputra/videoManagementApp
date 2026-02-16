## Frontend- Getting Started

### 1) run the backend python server:

### 2)  Install Dependencies
Run the following command inside the frontend folder:
```bash
npm install
```

### 3)  Set Environment Variable
Create a .env.local file in the frontend directory and add:
```bash
NEXT_PUBLIC_API_URL=http://exampleServer
```
Replace http://exampleServer with your actual backend server URL.

### 4)  Start the Development Server
After installing dependencies and setting up environment variables, run:
```bash
npm run dev
```
The app will be available at:
```bash
http://localhost:3000
```

## Application Pages

# Dashboard / Video List

1. Displays all uploaded videos in a paginated table.
2. Filters by title search and status.

# Upload / Create Video Page
1. Form to upload a new video.
2. Inputs: Title, Description, Video File.
3. Submits to POST /videos.

# Video Detail / View Page
1. Shows video information: title, description, duration, status.
2. Option to split video into segments.
3. Show splited segments
4. On clicking segments allow you to preview splited video in new tab and can be downloaded.

# Edit Video Page
1. Form to update video metadata.
2. Pre-filled with current title and description.
3. Submits to PATCH /videos/{id}.
