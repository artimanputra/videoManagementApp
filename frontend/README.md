## Getting Started

First, run the backend python server:

Then Install the node module:
NEXT_PUBLIC_API_URL : `http://exambleServer`

```bash
npm run dev
```

Add Envornment Variable for server route:


Then start the frontend using:
```bash
npm run dev
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
