# VoltRoute: API Documentation & Backend Contracts

## 1. Overview & Base URLs

VoltRoute exposes a RESTful API following JSON standards over HTTPS.

| Environment | Base URL | Swagger UI URL | OpenAPI JSON Spec |
| :--- | :--- | :--- | :--- |
| **Local Development** | `http://localhost:8080` | `http://localhost:8080/swagger-ui.html` | `http://localhost:8080/v3/api-docs` |
| **Frontend Proxy** | `http://localhost:5173/api` | &mdash; | &mdash; |

---

## 2. Authentication & Security Schemes

### 2.1 Bearer Token Specification
VoltRoute uses stateless JSON Web Token (JWT) authentication for all protected endpoints.
Clients must include the access token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token_here>
```

### 2.2 Security Configuration & Access Policy
* **Public Endpoints (No Credentials Required)**:
  * `GET /api/health` &mdash; System liveness and readiness probe
  * `GET /actuator/**` &mdash; Spring Boot Actuator monitoring
  * `GET /v3/api-docs/**` &mdash; OpenAPI 3.0 specification
  * `GET /swagger-ui/**`, `GET /swagger-ui.html` &mdash; Interactive API explorer
  * `POST /api/auth/**` &mdash; User registration and login (Phase 4)
* **Protected Endpoints**:
  * All business endpoints require authentication (`anyRequest().authenticated()`).
  * Unauthenticated requests to protected endpoints return `HTTP 401 Unauthorized` with an [`ApiErrorResponse`](#4-error-response-conventions).

---

## 3. Standard Response Envelopes

### 3.1 Generic Success Envelope (`ApiResponse<T>`)
Every successful API call returns a structured JSON payload:

```json
{
  "success": true,
  "status": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-10-28T11:47:44.226Z"
}
```

### 3.2 Fields Specification

| Field | Type | Description |
| :--- | :--- | :--- |
| `success` | `boolean` | `true` for 2xx responses, `false` otherwise |
| `status` | `integer` | HTTP status code (e.g. 200, 201) |
| `message` | `string` | Human-readable status message |
| `data` | `object \| array` | Payload content |
| `timestamp` | `string` | ISO 8601 UTC timestamp of execution |

---

## 4. Error Response Conventions

All errors thrown across controllers are intercepted by [`GlobalExceptionHandler`](file:///backend/src/main/java/com/voltroute/common/exception/GlobalExceptionHandler.java) and converted into a standard [`ApiErrorResponse`](file:///backend/src/main/java/com/voltroute/common/response/ApiErrorResponse.java).

### 4.1 General Error Response Format
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "message": "Station not found with id: 'STA-1029'",
  "path": "/api/stations/STA-1029",
  "timestamp": "2026-10-28T11:47:44.226Z"
}
```

### 4.2 Validation Error Response Format (HTTP 400)
When request body validation fails (`@Valid`), field-level errors are populated in `validationErrors`:

```json
{
  "success": false,
  "status": 400,
  "error": "Validation Failed",
  "message": "Input validation failed. See 'validationErrors' for details.",
  "path": "/api/auth/register",
  "timestamp": "2026-10-28T11:47:44.226Z",
  "validationErrors": {
    "email": "Invalid email format",
    "password": "Password cannot be blank"
  }
}
```

### 4.3 HTTP Status Codes Standard

| HTTP Code | Exception Name | Description |
| :--- | :--- | :--- |
| **`200 OK`** | &mdash; | Successful request |
| **`201 Created`** | &mdash; | Resource successfully created |
| **`400 Bad Request`** | `BadRequestException`, `MethodArgumentNotValidException`, `HttpMessageNotReadableException` | Validation failure or malformed payload |
| **`401 Unauthorized`** | `UnauthorizedException`, `BadCredentialsException` | Missing or invalid authentication token |
| **`403 Forbidden`** | `AccessDeniedException` | Insufficient role permissions |
| **`404 Not Found`** | `ResourceNotFoundException`, `NoResourceFoundException` | Requested resource/path does not exist |
| **`405 Method Not Allowed`** | `HttpRequestMethodNotSupportedException` | HTTP method not supported for endpoint |
| **`409 Conflict`** | `ConflictException` | Duplicate entity or state collision |
| **`500 Internal Error`** | `Exception` | Unhandled server error (sanitized response) |

---

## 5. Endpoints Specification

### 5.1 Health Probe Endpoint

* **URL**: `/api/health`
* **Method**: `GET`
* **Authentication**: None (Public)
* **Summary**: System Liveness and Readiness Probe
* **Description**: Verifies API operational status, active Spring profiles, and relational database connectivity.

#### Response: `200 OK`
```json
{
  "success": true,
  "status": 200,
  "message": "Service operational",
  "data": {
    "status": "UP",
    "service": "voltroute-backend",
    "version": "0.0.1-SNAPSHOT",
    "timestamp": "2026-10-28T11:47:44.225Z",
    "environment": "local",
    "components": {
      "database": "UP"
    }
  },
  "timestamp": "2026-10-28T11:47:44.226Z"
}
```

---

### 5.2 User Registration Endpoint

* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Authentication**: None (Public)
* **Summary**: Register a new user account
* **Description**: Validates input data, normalizes email, checks for duplicates, hashes password using BCrypt (strength 12), persists user with default `ROLE_USER`, and returns a signed JWT access token.

#### Request Body
```json
{
  "email": "user@voltroute.com",
  "password": "SecurePassword123!",
  "firstName": "Alex",
  "lastName": "Rivera"
}
```

#### Response: `201 Created`
```json
{
  "success": true,
  "status": 201,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQHZvbHRyb3V0ZS5jb20iLCJpZCI6MSwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImlhdCI6MTcyOTAwMDAwMCwiZXhwIjoxNzI5MDg2NDAwfQ.signature",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "email": "user@voltroute.com",
      "firstName": "Alex",
      "lastName": "Rivera",
      "roles": ["ROLE_USER"],
      "createdAt": "2026-10-28T11:50:00"
    }
  },
  "timestamp": "2026-10-28T11:50:00.123Z"
}
```

#### Error Responses
* **`400 Bad Request`**: Validation failure (blank fields, invalid email format, password < 6 characters).
* **`409 Conflict`**: Email address is already registered (`existsByEmailIgnoreCase`).

---

### 5.3 User Login Endpoint

* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Authentication**: None (Public)
* **Summary**: Authenticate user credentials
* **Description**: Verifies email (normalized) and password against stored BCrypt hashes. Issues a signed JWT bearer token on success.

#### Request Body
```json
{
  "email": "user@voltroute.com",
  "password": "SecurePassword123!"
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "status": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQHZvbHRyb3V0ZS5jb20iLCJpZCI6MSwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImlhdCI6MTcyOTAwMDAwMCwiZXhwIjoxNzI5MDg2NDAwfQ.signature",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "email": "user@voltroute.com",
      "firstName": "Alex",
      "lastName": "Rivera",
      "roles": ["ROLE_USER"],
      "createdAt": "2026-10-28T11:50:00"
    }
  },
  "timestamp": "2026-10-28T11:51:00.456Z"
}
```

#### Error Responses
* **`400 Bad Request`**: Missing email or password.
* **`401 Unauthorized`**: Invalid email or password (anti-enumeration constant error response).

---

### 5.4 Get User Profile Endpoint

* **URL**: `/api/users/profile`
* **Method**: `GET`
* **Authentication**: `Bearer <token>` (Protected)
* **Summary**: Retrieve current authenticated user profile
* **Description**: Returns profile details for the authenticated user based on the JWT token subject. Sensitive fields (e.g. password hash) are excluded.

#### Headers
```http
Authorization: Bearer <valid_jwt_token>
```

#### Response: `200 OK`
```json
{
  "success": true,
  "status": 200,
  "message": "Operation completed successfully",
  "data": {
    "id": 1,
    "email": "user@voltroute.com",
    "firstName": "Alex",
    "lastName": "Rivera",
    "roles": ["ROLE_USER"],
    "createdAt": "2026-10-28T11:50:00"
  },
  "timestamp": "2026-10-28T11:52:00.789Z"
}
```

#### Error Responses
* **`401 Unauthorized`**: Missing, invalid, expired, or tampered JWT token.
* **`404 Not Found`**: User record corresponding to token subject not found.

---

### 5.5 Discover Nearby Charging Stations

* **URL**: `/api/stations`
* **Method**: `GET`
* **Authentication**: None (Public)
* **Summary**: Discover nearby charging stations
* **Description**: Performs a geographic radius search around latitude/longitude coordinates querying Open Charge Map.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `latitude` | `Double` | **Yes** | Center point latitude (-90 to 90) | `37.7749` |
| `longitude` | `Double` | **Yes** | Center point longitude (-180 to 180) | `-122.4194` |
| `radiusKm` | `Double` | No | Search radius in km (0.1 to 200.0, default 10.0) | `15.0` |
| `maxResults` | `Integer` | No | Max stations to return (1 to 100, default 50) | `50` |
| `connectionTypeId` | `Integer` | No | OCM connector type ID filter | `33` |
| `minPowerKw` | `Double` | No | Minimum charging power filter in kW | `50.0` |

#### Response: `200 OK`
```json
{
  "success": true,
  "status": 200,
  "message": "Retrieved 1 stations",
  "data": [
    {
      "id": 163371,
      "ocmUuid": "599AEB21-A1F2-4EF6-8809-419C2D46D0AF",
      "title": "Pupatella Richmond Superchargers",
      "location": {
        "latitude": 37.546347,
        "longitude": -77.456361,
        "addressLine1": "1 N Morris St",
        "city": "Richmond",
        "stateOrProvince": "VA",
        "postalCode": "23220",
        "countryCode": "US",
        "countryName": "United States",
        "distanceKm": 5.2
      },
      "operatorName": "Tesla",
      "operationalStatus": "Operational",
      "realTimeOccupancyAvailable": false,
      "totalConnectors": 8,
      "connectorTypes": [
        "Tesla Supercharger",
        "CCS (Type 2)"
      ],
      "maxPowerKw": 250.0
    }
  ],
  "timestamp": "2026-10-28T12:00:00.000Z"
}
```

#### Error Responses
* **`400 Bad Request`**: Missing coordinates or out-of-bounds coordinates / radius.
* **`502 Bad Gateway`**: Upstream Open Charge Map provider outage, timeout, or rate limit.

---

### 5.6 Search Charging Stations by City

* **URL**: `/api/stations/search`
* **Method**: `GET`
* **Authentication**: None (Public)
* **Summary**: Search charging stations by city/town
* **Description**: Queries stations within a specific town or city. Coordinates or countryCode is required.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `city` | `String` | **Yes** | City or town name | `Richmond` |
| `countryCode` | `String` | Conditional | ISO two-letter country code (required if coordinates absent) | `US` |
| `latitude` | `Double` | No | Optional center latitude | `37.54` |
| `longitude` | `Double` | No | Optional center longitude | `-77.45` |
| `maxResults` | `Integer` | No | Max stations to return (default 50) | `50` |

#### Response: `200 OK`
```json
{
  "success": true,
  "status": 200,
  "message": "Found 1 stations matching query",
  "data": [ ... ],
  "timestamp": "2026-10-28T12:00:00.000Z"
}
```

---

### 5.7 Get Station Details by ID

* **URL**: `/api/stations/{stationId}`
* **Method**: `GET`
* **Authentication**: None (Public)
* **Summary**: Get comprehensive station details by ID
* **Description**: Returns complete technical specifications, all charging plugs/connectors, operator metadata, and driver access comments.

#### Path Variables
* `stationId` (Long): Open Charge Map numeric station identifier (e.g. `163371`).

#### Response: `200 OK`
```json
{
  "success": true,
  "status": 200,
  "message": "Station details retrieved",
  "data": {
    "id": 163371,
    "ocmUuid": "599AEB21-A1F2-4EF6-8809-419C2D46D0AF",
    "title": "Pupatella Richmond Superchargers",
    "location": {
      "latitude": 37.546347,
      "longitude": -77.456361,
      "addressLine1": "1 N Morris St",
      "city": "Richmond",
      "stateOrProvince": "VA",
      "postalCode": "23220",
      "countryCode": "US",
      "countryName": "United States",
      "distanceKm": null
    },
    "operatorName": "Tesla",
    "operatorWebsite": "https://www.tesla.com/supercharger",
    "contactTelephone": "(804) 355-3135",
    "contactEmail": null,
    "accessComments": "Available for customers. Self park.",
    "generalComments": "2 Tesla Connectors, up to 12kW.",
    "operationalStatus": "Operational",
    "realTimeOccupancyAvailable": false,
    "dateLastStatusUpdate": "2020-08-22T05:51:00Z",
    "connectors": [
      {
        "id": 234940,
        "connectionTypeId": 30,
        "connectionTypeName": "Tesla (J1772 / Generic)",
        "formalName": "SAE J1772",
        "powerKw": 12.0,
        "voltage": 208,
        "amps": null,
        "currentType": "AC (Single-Phase)",
        "quantity": 2,
        "status": "Operational",
        "isFastChargeCapable": false
      }
    ]
  },
  "timestamp": "2026-10-28T12:00:00.000Z"
}
```

#### Error Responses
* **`400 Bad Request`**: Non-numeric or non-positive station ID.
* **`404 Not Found`**: Station does not exist in Open Charge Map.
* **`502 Bad Gateway`**: Upstream Open Charge Map provider outage or timeout.

---

## 7. Charging Station Favorites Endpoints (Phase 8)

The Favorites API provides persistent, user-specific bookmarking of preferred charging stations. All endpoints strictly require JWT Bearer authentication. Requests are scoped exclusively to the authenticated caller's identity extracted from the verified JWT principal.

### 7.1 Add Station to Favorites

* **URL**: `/api/favorites`
* **Method**: `POST`
* **Authorization**: Bearer token required
* **Content-Type**: `application/json`

#### Request Body Schema (`FavoriteRequest`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `stationId` | `Long` | Yes | External Open Charge Map station identifier (positive integer) |
| `stationTitle` | `String` | Yes | Name / title of the charging station (not blank) |
| `operatorName` | `String` | No | Charging network or owner operator name |
| `addressLine` | `String` | No | Street address line |
| `city` | `String` | No | City or town |
| `stateOrProvince` | `String` | No | State or province code/name |
| `countryCode` | `String` | No | 2-letter ISO country code |
| `latitude` | `Double` | No | Geographic latitude coordinate (-90 to 90) |
| `longitude` | `Double` | No | Geographic longitude coordinate (-180 to 180) |
| `maxPowerKw` | `Double` | No | Peak power delivery in kW |
| `totalConnectors` | `Integer` | No | Total connector points/bays available |
| `connectorTypes` | `List<String>` | No | List of connector standard names |

#### Example Request
```http
POST /api/favorites HTTP/1.1
Host: localhost:8080
Authorization: Bearer <valid_jwt_token>
Content-Type: application/json

{
  "stationId": 163371,
  "stationTitle": "Pupatella Richmond Superchargers",
  "operatorName": "Tesla",
  "addressLine": "1 N Morris St",
  "city": "Richmond",
  "stateOrProvince": "VA",
  "countryCode": "US",
  "latitude": 37.546347,
  "longitude": -77.456361,
  "maxPowerKw": 12.0,
  "totalConnectors": 2,
  "connectorTypes": ["Tesla (J1772 / Generic)"]
}
```

#### Example Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "status": 201,
  "message": "Station added to favorites successfully",
  "data": {
    "id": 1,
    "stationId": 163371,
    "stationTitle": "Pupatella Richmond Superchargers",
    "operatorName": "Tesla",
    "addressLine": "1 N Morris St",
    "city": "Richmond",
    "stateOrProvince": "VA",
    "countryCode": "US",
    "latitude": 37.546347,
    "longitude": -77.456361,
    "maxPowerKw": 12.0,
    "totalConnectors": 2,
    "connectorTypes": ["Tesla (J1772 / Generic)"],
    "createdAt": "2026-10-28T13:40:00Z"
  },
  "timestamp": "2026-10-28T13:40:00.123Z"
}
```

#### Error Responses
* **`400 Bad Request`**: Missing `stationId` or `stationTitle`.
* **`401 Unauthorized`**: Missing, invalid, or expired Bearer token.
* **`409 Conflict`**: Station is already bookmarked in the user's favorites list (`Station is already in your favorites`).

---

### 7.2 Retrieve User Favorites

* **URL**: `/api/favorites`
* **Method**: `GET`
* **Authorization**: Bearer token required

Returns all charging stations bookmarked by the authenticated user, ordered with newest additions first.

#### Example Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "status": 200,
  "message": "Favorites retrieved successfully",
  "data": [
    {
      "id": 1,
      "stationId": 163371,
      "stationTitle": "Pupatella Richmond Superchargers",
      "operatorName": "Tesla",
      "addressLine": "1 N Morris St",
      "city": "Richmond",
      "stateOrProvince": "VA",
      "countryCode": "US",
      "latitude": 37.546347,
      "longitude": -77.456361,
      "maxPowerKw": 12.0,
      "totalConnectors": 2,
      "connectorTypes": ["Tesla (J1772 / Generic)"],
      "createdAt": "2026-10-28T13:40:00Z"
    }
  ],
  "timestamp": "2026-10-28T13:40:05.456Z"
}
```

#### Error Responses
* **`401 Unauthorized`**: Missing, invalid, or expired Bearer token.

---

### 7.3 Remove Station from Favorites

* **URL**: `/api/favorites/{stationId}`
* **Method**: `DELETE`
* **Authorization**: Bearer token required

Removes a bookmarked station by its external `stationId`. Users can only remove their own favorites; cross-user deletions are prevented at the service layer and return `404 Not Found`.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `stationId` | `Long` | Yes | External Open Charge Map station identifier |

#### Example Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "status": 200,
  "message": "Station removed from favorites successfully",
  "data": null,
  "timestamp": "2026-10-28T13:40:10.789Z"
}
```

#### Error Responses
* **`401 Unauthorized`**: Missing, invalid, or expired Bearer token.
* **`404 Not Found`**: The station is not in the caller's favorites list (`Favorite station not found with id: ...`).

---

## 8. Route Planning & Charging Stop Recommendation Endpoints (Phase 9)

The Route Planning API coordinates between OpenRouteService and Open Charge Map to compute road driving geometry, project candidate charging stations along the route corridor, apply deterministic candidate ranking, and determine EV battery feasibility.

### 8.1 Plan EV Route & Charging Stops

* **URL**: `/api/routes/plan`
* **Method**: `POST`
* **Authorization**: Public (JWT optional; authenticated users can bookmark recommended stops directly)
* **Content-Type**: `application/json`

#### Request Body Schema (`RoutePlanRequest`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `originLatitude` | `Double` | Yes | &mdash; | Origin latitude in decimal degrees (-90 to 90) |
| `originLongitude` | `Double` | Yes | &mdash; | Origin longitude in decimal degrees (-180 to 180) |
| `originName` | `String` | No | &mdash; | Human-readable origin label |
| `destinationLatitude` | `Double` | Yes | &mdash; | Destination latitude in decimal degrees (-90 to 90) |
| `destinationLongitude` | `Double` | Yes | &mdash; | Destination longitude in decimal degrees (-180 to 180) |
| `destinationName` | `String` | No | &mdash; | Human-readable destination label |
| `vehicleRangeKm` | `Double` | No | &mdash; | Full battery driving range in kilometers |
| `currentBatteryPercent` | `Double` | No | &mdash; | Current battery state of charge percentage (1.0 to 100.0) |
| `batteryCapacityKwh` | `Double` | No | &mdash; | Total battery pack capacity in kWh |
| `consumptionKwhPer100Km` | `Double` | No | &mdash; | Average vehicle energy consumption rate in kWh / 100 km |
| `minPowerKw` | `Double` | No | &mdash; | Minimum charger power in kW |
| `connectorType` | `String` | No | &mdash; | Preferred connector standard (e.g. `CCS`, `Tesla`, `Type 2`, `CHAdeMO`) |
| `maxDetourKm` | `Double` | No | `15.0` | Maximum acceptable detour off the main route corridor (km) |

#### Example Request
```http
POST /api/routes/plan HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "originLatitude": 37.7749,
  "originLongitude": -122.4194,
  "originName": "San Francisco, CA",
  "destinationLatitude": 38.5816,
  "destinationLongitude": -121.4944,
  "destinationName": "Sacramento, CA",
  "vehicleRangeKm": 300.0,
  "currentBatteryPercent": 35.0,
  "connectorType": "CCS",
  "minPowerKw": 50.0,
  "maxDetourKm": 15.0
}
```

#### Example Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "status": 200,
  "message": "EV route planned successfully",
  "data": {
    "origin": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "addressLine1": "San Francisco, CA"
    },
    "destination": {
      "latitude": 38.5816,
      "longitude": -121.4944,
      "addressLine1": "Sacramento, CA"
    },
    "distanceKm": 140.0,
    "durationMinutes": 90.0,
    "geometry": [
      [37.7749, -122.4194],
      [38.2500, -122.0400],
      [38.5816, -121.4944]
    ],
    "feasibility": "FEASIBLE_WITH_STOPS",
    "feasibilityNotice": "Deterministic range estimate. Real-world EV range varies with driving speed, ambient temperature, elevation, headwinds, payload, HVAC, and battery health.",
    "isChargingRequired": true,
    "estimatedStopsNeeded": 1,
    "estimatedEnergyConsumptionKwh": 25.9,
    "recommendedStops": [
      {
        "station": {
          "id": 202,
          "title": "Vacaville DC Fast Hub",
          "operatorName": "Electrify America",
          "location": {
            "latitude": 38.2500,
            "longitude": -122.0400
          },
          "maxPowerKw": 150.0,
          "totalConnectors": 8,
          "connectorTypes": ["CCS"]
        },
        "detourDistanceKm": 0.8,
        "distanceFromOriginKm": 65.0,
        "estimatedBatteryAtArrivalPercent": 13.3,
        "compositeScore": 92.4,
        "rankingReason": "Ultra-Fast DC (150 kW) • 0.8 km detour • 8 bays (low wait risk) • CCS matched",
        "isRecommendedStop": true
      }
    ],
    "allCandidateStops": [ ... ]
  },
  "timestamp": "2026-10-28T14:10:00.000Z"
}
```

#### Feasibility States (`feasibility`)
* **`FEASIBLE_DIRECT`**: Total distance is less than or equal to 85% of usable battery range; trip can be completed directly without charging.
* **`FEASIBLE_WITH_STOPS`**: Route exceeds current battery range, and viable candidate stops are positioned in safe reachable windows.
* **`RANGE_CONSTRAINED_NO_STOPS_FOUND`**: Route exceeds vehicle range, but no compatible charging stations were found along the corridor.
* **`ESTIMATE_ONLY_NO_VEHICLE_DATA`**: Vehicle range or battery state was omitted; geometry is computed without guaranteed energy feasibility.

#### Deterministic Candidate-Ranking Model (0 - 100 points)
$$\text{Score} = S_{\text{power}} + S_{\text{detour}} + S_{\text{bays}} + S_{\text{compat}} + S_{\text{status}}$$
* $S_{\text{power}} \in [0, 35]$: Rated charging power output ($\min(35, \frac{\text{kW}}{350} \times 35)$).
* $S_{\text{detour}} \in [0, 30]$: Deviation penalty off main route line ($30 \times (1 - \frac{\text{detour}}{\text{maxDetour}})$).
* $S_{\text{bays}} \in [0, 15]$: Total bays available to mitigate wait times ($\min(15, \text{bays} \times 2.5)$).
* $S_{\text{compat}} \in [0, 15]$: Plug compatibility match (+15 for matching user's connector).
* $S_{\text{status}} \in [0, 5]$: Verified operational status.

#### Error Responses
* **`400 Bad Request`**: Coordinate validation error or identical origin/destination coordinates.
* **`502 Bad Gateway`**: Upstream OpenRouteService outage, timeout, or unroutable coordinates.


