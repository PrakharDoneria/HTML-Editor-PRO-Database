# Project Management API

## Endpoints

### 1. Save Project

- **Method:** `POST /save`
- **Request Body:**
  ```json
  {
    "url": "https://example.com/file.jpg",
    "projectName": "My Project",
    "username": "user123",
    "uid": "user-unique-id",
    "verified": false,
    "email": "user@example.com"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "projectId": "1"
  }
  ```

### 2. Rename Project

- **Method:** `PUT /rename`
- **Request Body:**
  ```json
  {
    "projectId": "1",
    "name": "New Project Name"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Project renamed successfully."
  }
  ```

### 3. Get Projects (Paginated)

- **Method:** `GET /projects?offset=0`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "File": "https://example.com/file.jpg",
        "FileName": "My Project",
        "Username": "user123",
        "UID": "user-unique-id",
        "Verified": false,
        "Email": "user@example.com",
        "Download": "0"
      }
    ],
    "total": 10
  }
  ```

### 4. Get User's Projects

- **Method:** `GET /profile?uid=user-unique-id`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "File": "https://example.com/file.jpg",
        "FileName": "My Project",
        "Username": "user123",
        "UID": "user-unique-id",
        "Verified": false,
        "Email": "user@example.com",
        "Download": "0"
      }
    ]
  }
  ```

### 5. Verify Project

- **Method:** `GET /verify?projectId=1`
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Project verified."
  }
  ```

### 6. Get Project Info

- **Method:** `GET /info?projectId=1`
- **Response:**
  ```json
  {
    "status": "success",
    "projectId": "1",
    "FileName": "My Project",
    "Username": "user123",
    "UID": "user-unique-id",
    "Verified": false,
    "Download": "0"
  }
  ```

### 7. Get Leaderboard

- **Method:** `GET /leaderboard`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "FileName": "My Project",
        "Username": "user123",
        "Download": "100"
      }
    ]
  }
  ```

### 8. Search Projects

- **Method:** `GET /search?q=my+project`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "FileName": "My Project",
        "Username": "user123",
        "UID": "user-unique-id",
        "Verified": false,
        "Download": "0"
      }
    ]
  }
  ```

### 9. Delete Project

- **Method:** `DELETE /delete`
- **Request Body:**
  ```json
  {
    "projectId": "1",
    "uid": "user-unique-id"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Project deleted."
  }
  ```

### 10. Increase Download Count

- **Method:** `GET /increase?projectId=1`
- **Response:**
  ```json
  {
    "status": "success",
    "download": "1"
  }
  ```

### 11. Clean Database

- **Method:** `GET /clean`
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Database cleaned."
  }
  ```
