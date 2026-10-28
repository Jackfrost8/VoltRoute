# VoltRoute: Authentication & Authorization Architecture

## 1. Overview & Security Model

VoltRoute implements enterprise-grade, stateless JSON Web Token (JWT) authentication and role-based access control (RBAC). 

Key design principles:
* **Stateless Session Management**: No server-side session state is maintained (`SessionCreationPolicy.STATELESS`). Every authenticated request carries an HMAC-SHA256 signed bearer token.
* **Strict Email Normalization**: All user email inputs are trimmed and lowercased (`email.trim().toLowerCase()`) before uniqueness verification, database storage, and authentication matching, eliminating casing collision vulnerabilities.
* **Resilient Password Hashing**: Passwords are encrypted using BCrypt with work factor 12 (`BCryptPasswordEncoder(12)`). Raw passwords are never logged, stored, or serialized.
* **Anti-Enumeration Protections**: Login failure responses return identical error envelopes (`"Invalid email or password"`, HTTP 401) regardless of whether the email exists or the password was incorrect, preventing username harvesting.
* **Subject-Level User Isolation**: Protected endpoints (such as `GET /api/users/profile`) resolve identity directly from the cryptographically verified JWT subject (`Principal.getName()`), preventing horizontal privilege escalation.

---

## 2. JWT Token Specification

Tokens are generated and validated using the JJWT library (`io.jsonwebtoken:jjwt-api:0.12.6`).

### 2.1 Cryptographic Parameters
* **Algorithm**: HMAC using SHA-256 (`HS256`).
* **Secret Key Requirement**: Cryptographically strong symmetric key (minimum 256 bits) configured via `VOLTROUTE_JWT_SECRET` (mapped to `voltroute.jwt.secret`).
* **Default Lifespan**: 24 hours (`86,400,000` ms), configurable via `VOLTROUTE_JWT_EXPIRATION_MS`.

### 2.2 Token Claims Structure
* **Header**:
  ```json
  {
    "alg": "HS256"
  }
  ```
* **Payload**:
  ```json
  {
    "sub": "user@voltroute.com",
    "id": 1,
    "roles": ["ROLE_USER"],
    "iat": 1729000000,
    "exp": 1729086400
  }
  ```

---

## 3. Core Component Architecture

```
Client (React / Postman)
       │
       │ HTTP Authorization: Bearer <token>
       ▼
[ SecurityFilterChain ]
       │
       ├─► [ JwtAuthenticationFilter ]
       │         │
       │         ├─ Extract Bearer token from "Authorization" header
       │         ├─ Validate signature, expiration & structure (JwtTokenProvider)
       │         ├─ Extract email subject & load UserDetails (CustomUserDetailsService)
       │         └─ Populate SecurityContextHolder (UsernamePasswordAuthenticationToken)
       │
       ├─► [ JwtAuthenticationEntryPoint ] (Catches unauthenticated 401s)
       ├─► [ JwtAccessDeniedHandler ] (Catches forbidden/insufficient privilege 403s)
       │
       ▼
[ Controller Layer ] (AuthController, UserController, etc.)
       │
       ├─► [ AuthService ] (Registration, Login, Token generation)
       ├─► [ UserService ] (Profile retrieval, user lookups)
       │
       ▼
[ Data Layer ] (UserRepository, RoleRepository, PostgreSQL / H2)
```

### 3.1 Security Classes
1. **[`SecurityConfig`](file:///backend/src/main/java/com/voltroute/config/SecurityConfig.java)**: Configures stateless security filter chain, explicit CORS policy, public endpoint whitelist, and wires custom filters.
2. **[`JwtAuthenticationFilter`](file:///backend/src/main/java/com/voltroute/security/JwtAuthenticationFilter.java)**: Intercepts inbound HTTP requests, extracts bearer tokens, validates integrity, and binds authenticated `UserPrincipal` into the `SecurityContext`.
3. **[`JwtTokenProvider`](file:///backend/src/main/java/com/voltroute/security/JwtTokenProvider.java)**: Handles signing, claims generation, subject extraction, and comprehensive exception validation (`ExpiredJwtException`, `MalformedJwtException`, `SecurityException`).
4. **[`UserPrincipal`](file:///backend/src/main/java/com/voltroute/security/UserPrincipal.java)**: Implements Spring Security `UserDetails`, wrapping the VoltRoute `User` entity and mapping `Role` sets into `GrantedAuthority` collections.
5. **[`CustomUserDetailsService`](file:///backend/src/main/java/com/voltroute/security/CustomUserDetailsService.java)**: Loads user details by normalized email address for Spring's `AuthenticationManager`.
6. **[`JwtAuthenticationEntryPoint`](file:///backend/src/main/java/com/voltroute/security/JwtAuthenticationEntryPoint.java)**: Formats authentication failures into the standard `ApiErrorResponse` (HTTP 401 JSON).
7. **[`JwtAccessDeniedHandler`](file:///backend/src/main/java/com/voltroute/security/JwtAccessDeniedHandler.java)**: Formats authorization/privilege failures into the standard `ApiErrorResponse` (HTTP 403 JSON).

---

## 4. Endpoints & Authentication Workflows

### 4.1 User Registration (`POST /api/auth/register`)
1. Client submits registration payload (`email`, `password`, `firstName`, `lastName`).
2. Bean validation (`@Valid`) checks email format, password length (6-100 characters), and non-blank names.
3. System normalizes email to lowercase.
4. Checks uniqueness via `userRepository.existsByEmailIgnoreCase(normalizedEmail)`.
   * If exists $\rightarrow$ Throws `ConflictException` (HTTP 409 Conflict).
5. Hashes password using `passwordEncoder.encode(password)` (BCrypt strength 12).
6. Assigns default `ROLE_USER` from database.
7. Saves new user entity and issues an immediate signed JWT token.

### 4.2 User Login (`POST /api/auth/login`)
1. Client submits credentials (`email`, `password`).
2. Email is normalized to lowercase.
3. Authenticates via Spring's `AuthenticationManager.authenticate(...)`.
   * If credentials fail or user is missing $\rightarrow$ Throws `BadCredentialsException` (HTTP 401 Unauthorized with message `"Invalid email or password"`).
4. Generates signed JWT token with user ID and roles claims.
5. Returns `AuthResponse` containing token, expiry, and `UserProfileDto`.

### 4.3 Profile Retrieval (`GET /api/users/profile`)
1. Client supplies `Authorization: Bearer <token>`.
2. `JwtAuthenticationFilter` validates token and sets security context.
3. `UserController` reads `Principal.getName()` (authenticated email).
4. Fetches current user profile from `UserService`.
5. Returns `UserProfileDto` (password hash and internal credentials excluded).

---

## 5. Security & Verification Matrix

| Scenario | Request | Expected Status | Response Error / Message |
| :--- | :--- | :--- | :--- |
| **Valid Registration** | `POST /api/auth/register` | `201 Created` | `"User registered successfully"` + JWT & User DTO |
| **Duplicate Email** | `POST /api/auth/register` | `409 Conflict` | `"Email is already registered: ..."` |
| **Invalid Email Format** | `POST /api/auth/register` | `400 Bad Request` | `"Validation Failed"` (`validationErrors.email`) |
| **Short Password (<6)** | `POST /api/auth/register` | `400 Bad Request` | `"Validation Failed"` (`validationErrors.password`) |
| **Missing Names** | `POST /api/auth/register` | `400 Bad Request` | `"Validation Failed"` (`validationErrors.firstName`) |
| **Valid Login** | `POST /api/auth/login` | `200 OK` | `"Login successful"` + JWT & User DTO |
| **Incorrect Password** | `POST /api/auth/login` | `401 Unauthorized` | `"Invalid email or password"` |
| **Non-Existent User** | `POST /api/auth/login` | `401 Unauthorized` | `"Invalid email or password"` |
| **Missing Token** | `GET /api/users/profile` | `401 Unauthorized` | `"Full authentication is required to access this resource"` |
| **Tampered / Expired Token** | `GET /api/users/profile` | `401 Unauthorized` | `"Full authentication is required to access this resource"` |
| **Authorized Profile Access** | `GET /api/users/profile` | `200 OK` | User's own `UserProfileDto` |
