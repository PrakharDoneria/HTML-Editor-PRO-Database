# Project Management API

A simple API for managing and querying project data. This API allows you to save, retrieve, delete, and search for projects, as well as manage download counts and view leaderboards.

## Endpoints

### `/save` (POST)

Save a new project.

**Request Body:**
```json
{
  "url": "string",
  "projectName": "string",
  "username": "string",
  "uid": "string",
  "verified": "boolean",
  "email": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "projectId": "string"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to save project."
}
```

### `/projects` (GET)

Retrieve the latest 20 projects.

**Response:**
```json
{
  "status": "success",
  "projects": [
    {
      "projectId": "string",
      "File": "string",
      "FileName": "string",
      "Username": "string",
      "UID": "string",
      "Verified": "boolean",
      "Email": "string",
      "Download": "string"
    }
  ]
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to fetch projects."
}
```

### `/leaderboard` (GET)

Retrieve the top 10 projects by download count.

**Response:**
```json
{
  "status": "success",
  "projects": [
    {
      "projectId": "string",
      "File": "string",
      "FileName": "string",
      "Username": "string",
      "UID": "string",
      "Verified": "boolean",
      "Email": "string",
      "Download": "string"
    }
  ]
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to fetch leaderboard."
}
```

### `/search` (GET)

Search for projects by keywords.

**Query Parameters:**
- `q`: Search query string.

**Response:**
```json
{
  "status": "success",
  "projects": [
    {
      "projectId": "string",
      "File": "string",
      "FileName": "string",
      "Username": "string",
      "UID": "string",
      "Verified": "boolean",
      "Email": "string",
      "Download": "string"
    }
  ]
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to search projects."
}
```

### `/delete` (DELETE)

Delete a project by ID.

**Request Body:**
```json
{
  "projectId": "string",
  "uid": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Project deleted."
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Unauthorized." // or "Project not found."
}
```

### `/increase` (GET)

Increment the download count for a project.

**Query Parameters:**
- `projectId`: The ID of the project to increment the download count.

**Response:**
```json
{
  "status": "success",
  "download": "string"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to increase download count."
}
```

### `/clean` (GET)

Clean the database by removing all projects and resetting the project ID counter.

**Response:**
```json
{
  "status": "success",
  "message": "Database cleaned."
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to clean database."
}
```

## Running the Server

To start the server, run:

```sh
deno run --allow-net --allow-read --allow-write index.ts
```

## Notes

- Ensure that Deno is installed and properly configured on your system.
- Modify the `index.ts` path if necessary to match your file structure.
