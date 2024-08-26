### 1. **Save a Project**
- **Endpoint:** `/save`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "url": "http://example.com/file.zip",
    "projectName": "Sample Project",
    "username": "user123",
    "uid": "unique-user-id",
    "verified": true,
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

### 2. **Get Projects**
- **Endpoint:** `/projects`
- **Method:** `GET`
- **Query Parameters:** 
  - `offset` (optional): Start fetching projects from a specific index, e.g., `/projects?offset=20`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "File": "http://example.com/file.zip",
        "FileName": "Sample Project",
        "Username": "user123",
        "UID": "unique-user-id",
        "Verified": true,
        "Email": "user@example.com",
        "Download": "0"
      }
    ]
  }
  ```

### 3. **Get Project Details**
- **Endpoint:** `/info`
- **Method:** `GET`
- **Query Parameters:** 
  - `projectId` (required): The ID of the project, e.g., `/info?projectId=1`
- **Response:**
  ```json
  {
    "status": "success",
    "projectId": "1",
    "FileName": "Sample Project",
    "Username": "user123",
    "UID": "unique-user-id",
    "Verified": true,
    "Download": "0"
  }
  ```

### 4. **Increase Download Count**
- **Endpoint:** `/increase`
- **Method:** `GET`
- **Query Parameters:** 
  - `projectId` (required): The ID of the project, e.g., `/increase?projectId=1`
- **Response:**
  ```json
  {
    "status": "success",
    "download": "1"
  }
  ```

### 5. **Search Projects**
- **Endpoint:** `/search`
- **Method:** `GET`
- **Query Parameters:** 
  - `q` (required): Search query, e.g., `/search?q=sample`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "File": "http://example.com/file.zip",
        "FileName": "Sample Project",
        "Username": "user123",
        "Verified": true,
        "Download": "0"
      }
    ]
  }
  ```

### 6. **Delete a Project**
- **Endpoint:** `/delete`
- **Method:** `DELETE`
- **Request Body:**
  ```json
  {
    "projectId": "1",
    "uid": "unique-user-id"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Project deleted."
  }
  ```

### 7. **Get Leaderboard**
- **Endpoint:** `/leaderboard`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "status": "success",
    "projects": [
      {
        "projectId": "1",
        "File": "http://example.com/file.zip",
        "FileName": "Sample Project",
        "Username": "user123",
        "Verified": true,
        "Download": "100"
      }
    ]
  }
  ```

### 8. **Clean Database**
- **Endpoint:** `/clean`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Database cleaned."
  }
  ```

### 9. **CORS Preflight Request**
- **Endpoint:** `*`
- **Method:** `OPTIONS`
- **Response:**
  ```http
  HTTP/1.1 204 No Content
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  ```
