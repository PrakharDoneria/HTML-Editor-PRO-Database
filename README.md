# Project List API - Backend

This backend service provides APIs to manage and retrieve project information. It includes endpoints for fetching, adding, updating, and deleting projects. 

## API Endpoints

### 1. `GET /projects`

**Description**: Retrieves a paginated list of projects.

- **Query Parameters**:
  - `offset` (optional): The starting point of the data to fetch. Defaults to `0`.

- **Sample Request**:
  ```http
  GET /projects?offset=20
  ```

- **Sample Response**:
  ```json
  {
    "projects": [
      {
        "File": "url-to-file",
        "FileName": "Project Name",
        "Username": "user",
        "UID": "unique-id",
        "Verified": true,
        "Email": "user@example.com",
        "Download": "number",
        "projectId": "project-id"
      }
      // More projects...
    ]
  }
  ```

### 2. `POST /projects`

**Description**: Adds a new project to the database.

- **Request Body**:
  - `File`: URL to the project file.
  - `FileName`: Name of the project.
  - `Username`: Name of the project creator.
  - `UID`: Unique user identifier.
  - `Verified`: Boolean indicating if the project is verified.
  - `Email`: Email of the project creator.
  - `Download`: Number of downloads.
  - `projectId`: Unique project identifier.

- **Sample Request**:
  ```json
  {
    "File": "url-to-file",
    "FileName": "New Project",
    "Username": "creator",
    "UID": "unique-id",
    "Verified": false,
    "Email": "creator@example.com",
    "Download": "0",
    "projectId": "new-project-id"
  }
  ```

- **Sample Response**:
  ```json
  {
    "success": true,
    "message": "Project added successfully"
  }
  ```

### 3. `PUT /projects/:projectId`

**Description**: Updates the details of an existing project.

- **Path Parameter**:
  - `projectId`: Unique identifier of the project to update.

- **Request Body**: Fields to update. Example:
  ```json
  {
    "FileName": "Updated Project Name"
  }
  ```

- **Sample Response**:
  ```json
  {
    "success": true,
    "message": "Project updated successfully"
  }
  ```

### 4. `DELETE /projects/:projectId`

**Description**: Deletes a project.

- **Path Parameter**:
  - `projectId`: Unique identifier of the project to delete.

- **Sample Request**:
  ```http
  DELETE /projects/project-id
  ```

- **Sample Response**:
  ```json
  {
    "success": true,
    "message": "Project deleted successfully"
  }
  ```

## Error Handling

- **400 Bad Request**: Returned when invalid parameters are provided or required fields are missing.
- **404 Not Found**: Returned when the specified project does not exist.
- **500 Internal Server Error**: Returned when there is a server-side issue.

## Data Structure

- **File**: String (URL to the project file).
- **FileName**: String (Name of the project).
- **Username**: String (Name of the user who created the project).
- **UID**: String (Unique user identifier).
- **Verified**: Boolean (Indicates if the project is verified).
- **Email**: String (Email address of the user).
- **Download**: String (Number of times the project has been downloaded).
- **projectId**: String (Unique project identifier).
