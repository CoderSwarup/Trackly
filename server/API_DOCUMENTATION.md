# Live Chat & Location Sharing API Documentation

## Overview
This is a comprehensive API documentation for the Live Chat and Location Sharing backend application. The application provides real-time chat functionality with location sharing capabilities using WebSocket and REST API endpoints.

**Base URL:** `http://localhost:5000/api/v1`

## Architecture Features
- **Real-time Communication:** WebSocket with Socket.io
- **Database:** Redis for data storage and pub/sub
- **Scalability:** Redis pub/sub for horizontal scaling
- **Validation:** Joi schema validation
- **Location Services:** One-time and live location sharing

---

## Authentication

### User Login/Register
**Endpoint:** `POST /users/auth`

**Description:** Login existing user or register new user with username and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric only
- Password: 6-100 characters

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "john_doe",
      "isOnline": false,
      "lastSeen": "2025-01-27T10:30:00.000Z"
    },
    "message": "User authenticated successfully"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/v1/users/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

---

## User Management

### Get Active Users
**Endpoint:** `GET /users/active`

**Description:** Get list of all currently online users.

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "activeUsers": [
      {
        "id": "uuid-v4",
        "username": "john_doe",
        "isOnline": true,
        "lastSeen": "2025-01-27T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/v1/users/active
```

### Get User Status
**Endpoint:** `GET /users/:username/status`

**Description:** Get status of a specific user.

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "john_doe",
      "isOnline": true,
      "lastSeen": "2025-01-27T10:30:00.000Z"
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/v1/users/john_doe/status
```

---

## Chat Management

### Get Recent Messages
**Endpoint:** `GET /chat/messages`

**Description:** Get recent chat messages with pagination.

**Query Parameters:**
- `limit` (optional): Number of messages to fetch (1-100, default: 50)

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "messages": [
      {
        "id": "uuid-v4",
        "userId": "user-uuid",
        "username": "john_doe",
        "content": "Hello everyone!",
        "type": "text",
        "timestamp": "2025-01-27T10:30:00.000Z",
        "location": null
      }
    ],
    "count": 1,
    "limit": 50
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/v1/chat/messages?limit=20"
```

### Send Message (Testing Only)
**Endpoint:** `POST /chat/messages`

**Description:** Send a text message (primarily for testing - real implementation uses WebSocket).

**Request Body:**
```json
{
  "userId": "user-uuid",
  "username": "john_doe",
  "content": "Hello everyone!",
  "type": "text"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "uuid-v4",
      "userId": "user-uuid",
      "username": "john_doe",
      "content": "Hello everyone!",
      "type": "text",
      "timestamp": "2025-01-27T10:30:00.000Z",
      "location": null
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/v1/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "username": "john_doe",
    "content": "Hello everyone!",
    "type": "text"
  }'
```

### Cleanup Old Messages
**Endpoint:** `DELETE /chat/cleanup`

**Description:** Delete messages older than specified days.

**Query Parameters:**
- `days` (optional): Number of days (1-30, default: 7)

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "deletedCount": 15,
    "message": "Cleaned up messages older than 7 days"
  }
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:5000/api/v1/chat/cleanup?days=7"
```

---

## Location Management

### Get Active Live Locations
**Endpoint:** `GET /locations/live`

**Description:** Get all currently active live location shares.

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "liveLocations": [
      {
        "id": "uuid-v4",
        "userId": "user-uuid",
        "username": "john_doe",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": 10,
        "timestamp": "2025-01-27T10:30:00.000Z",
        "type": "live",
        "isActive": true
      }
    ],
    "count": 1
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/v1/locations/live
```

### Get Recent Locations
**Endpoint:** `GET /locations/recent`

**Description:** Get all recent location shares within specified hours.

**Query Parameters:**
- `hours` (optional): Number of hours to look back (1-168, default: 24)

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "locations": [
      {
        "id": "uuid-v4",
        "userId": "user-uuid",
        "username": "john_doe",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": 10,
        "timestamp": "2025-01-27T10:30:00.000Z",
        "type": "one_time",
        "isActive": true
      }
    ],
    "count": 1,
    "hours": 24
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/v1/locations/recent?hours=12"
```

### Share One-Time Location (Testing Only)
**Endpoint:** `POST /locations/share`

**Description:** Share a one-time location (primarily for testing - real implementation uses WebSocket).

**Request Body:**
```json
{
  "userId": "user-uuid",
  "username": "john_doe",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10
}
```

**Validation Rules:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Accuracy: >= 0 (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Location shared successfully",
  "data": {
    "location": {
      "id": "uuid-v4",
      "userId": "user-uuid",
      "username": "john_doe",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "timestamp": "2025-01-27T10:30:00.000Z",
      "type": "one_time",
      "isActive": true
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/v1/locations/share \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "username": "john_doe",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  }'
```

### Get Location by ID
**Endpoint:** `GET /locations/:locationId`

**Description:** Get specific location by ID.

**Query Parameters:**
- `type` (optional): "one_time" or "live" (default: "one_time")

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "location": {
      "id": "uuid-v4",
      "userId": "user-uuid",
      "username": "john_doe",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10,
      "timestamp": "2025-01-27T10:30:00.000Z",
      "type": "one_time",
      "isActive": true
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/v1/locations/location-uuid?type=live"
```

### Get User Locations
**Endpoint:** `GET /locations/user/:userId`

**Description:** Get all locations shared by a specific user.

**Query Parameters:**
- `includeInactive` (optional): "true" or "false" (default: "false")

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "locations": [
      {
        "id": "uuid-v4",
        "userId": "user-uuid",
        "username": "john_doe",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": 10,
        "timestamp": "2025-01-27T10:30:00.000Z",
        "type": "live",
        "isActive": true
      }
    ],
    "count": 1,
    "userId": "user-uuid"
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/v1/locations/user/user-uuid?includeInactive=true"
```

### Stop User Live Location
**Endpoint:** `POST /locations/user/:userId/live/stop`

**Description:** Stop all active live location sharing for a user.

**Response (200):**
```json
{
  "success": true,
  "message": "SUCCESS",
  "data": {
    "stoppedLocations": [
      {
        "id": "uuid-v4",
        "userId": "user-uuid",
        "username": "john_doe",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": 10,
        "timestamp": "2025-01-27T10:30:00.000Z",
        "type": "live",
        "isActive": false
      }
    ],
    "count": 1
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/v1/locations/user/user-uuid/live/stop
```

---

## WebSocket Events

### Connection
**Event:** `connection`
**Description:** Client connects to the server

### Authentication Events

#### Login
**Event:** `login`
**Client Sends:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Server Responds:**
- `login_success`: Successful authentication
- `login_error`: Authentication failed

#### Logout
**Event:** `logout`
**Description:** User logs out

### Chat Events

#### Send Message
**Event:** `send_message`
**Client Sends:**
```json
{
  "content": "Hello everyone!",
  "type": "text"
}
```

**Server Emits:**
- `message_sent`: Confirmation to sender
- `new_message`: Broadcast to other users

#### Get Recent Messages
**Event:** `get_recent_messages`
**Client Sends:**
```json
{
  "limit": 50
}
```

**Server Responds:**
- `recent_messages`: Array of recent messages

#### Typing Indicator
**Event:** `typing`
**Client Sends:**
```json
{
  "isTyping": true
}
```

**Server Broadcasts:**
- `user_typing`: Typing status to other users

### Location Events

#### Share One-Time Location
**Event:** `share_location`
**Client Sends:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10
}
```

**Server Emits:**
- `location_shared_success`: Confirmation to sender
- `location_shared`: Broadcast to other users

#### Start Live Location Sharing
**Event:** `start_live_location`
**Client Sends:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10
}
```

**Server Emits:**
- `live_location_started_success`: Confirmation to sender
- `live_location_started`: Broadcast to other users

#### Update Live Location
**Event:** `update_live_location`
**Client Sends:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10
}
```

**Server Emits:**
- `live_location_updated_success`: Confirmation to sender
- `live_location_updated`: Broadcast to other users

#### Stop Live Location
**Event:** `stop_live_location`
**Description:** Stop live location sharing

**Server Emits:**
- `live_location_stopped_success`: Confirmation to sender
- `live_location_stopped`: Broadcast to other users

#### Get Active Locations
**Event:** `get_active_locations`
**Description:** Get all active location shares

**Server Responds:**
- `active_locations`: Active live and recent locations

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation Error: Username must be at least 3 characters long",
  "data": null
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```

---

## Testing with Postman

### Environment Setup
Create a Postman environment with:
- `baseUrl`: `http://localhost:5000/api/v1`
- `userId`: Store user ID after authentication
- `username`: Store username after authentication

### Testing Flow
1. **Start Server:** Ensure Redis is running and start the server
2. **Health Check:** GET `{{baseUrl}}/test`
3. **Create Users:** POST `{{baseUrl}}/users/auth` with different usernames
4. **Get Active Users:** GET `{{baseUrl}}/users/active`
5. **Send Messages:** POST `{{baseUrl}}/chat/messages`
6. **Get Messages:** GET `{{baseUrl}}/chat/messages`
7. **Share Locations:** POST `{{baseUrl}}/locations/share`
8. **Get Locations:** GET `{{baseUrl}}/locations/recent`

### WebSocket Testing
For WebSocket testing, use tools like:
- **Socket.io Client:** Browser-based testing
- **Postman WebSocket:** Native WebSocket support
- **wscat:** Command-line WebSocket client

---

## Deployment Notes

### Environment Variables
Create `.env` file in server root:
```env
NODE_ENV=production
PORT=5000
SERVER_URL=http://your-domain.com/api/v1
CORS_ORIGIN=http://your-frontend-domain.com
REDIS_URL=redis://localhost:6379
```

### Redis Setup
Ensure Redis server is running:
```bash
# Start Redis (Ubuntu/Debian)
sudo systemctl start redis

# Start Redis (macOS with Homebrew)
brew services start redis

# Start Redis (Windows)
redis-server
```

### Scaling Considerations
- Use Redis Cluster for high availability
- Implement rate limiting for API endpoints
- Add monitoring and logging
- Use NGINX for load balancing
- Implement proper CORS policies

---

This API provides a robust foundation for a real-time chat application with location sharing capabilities. The architecture supports horizontal scaling through Redis pub/sub and maintains data consistency through proper validation and error handling.