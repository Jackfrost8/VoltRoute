# VoltRoute: AI-Powered EV Charging Station Finder & Intelligent Route Optimization Platform

VoltRoute is an intelligent mobility platform designed for Electric Vehicle (EV) drivers and fleet operators. It solves range anxiety, unpredictable charger occupancy, connector incompatibility, and multi-stop long-distance route planning.

---

## 1. Project Architecture & Technology Stack

* **Frontend Client (`frontend/`)**:
  * React 19 + Vite 8
  * Tailwind CSS + PostCSS
  * React Router v7 & Axios
  * Leaflet & React Leaflet (GIS Map visualization)
* **Backend API Gateway (`backend/`)**:
  * Java 21 LTS
  * Spring Boot 3.5.3
  * Apache Maven 3.9+
  * Spring Security 6 & Stateless JWT
  * Spring Data JPA & Hibernate 6
  * PostgreSQL 18
  * SpringDoc OpenAPI 2.8+ (Swagger UI)
* **External APIs**:
  * [Open Charge Map API](https://openchargemap.org/) (Global charging point registry)
  * [OpenRouteService API](https://openrouteservice.org/) (EV-aware directions & isochrones)
* **Machine Learning Service (`ml-service/`, Planned)**:
  * Python 3.14+ / FastAPI / scikit-learn / Joblib (Predicting charger wait-time queues and non-linear battery charging curves)

---

## 2. Prerequisites & Verified Toolchain

Ensure the following runtimes and tools are installed on your system:

| Tool | Minimum Version | Verified Local Version |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | Java 21 LTS | `21.0.11 LTS` (Oracle Corporation) |
| **Apache Maven** | Maven 3.9+ | `3.9.16` |
| **Node.js** | Node 20+ LTS | `v24.13.1` |
| **npm** | npm 10+ | `11.8.0` |
| **Python (for ML service)** | Python 3.12+ | `3.14.7` |
| **PostgreSQL Database** | PostgreSQL 16+ | `18.4` (Windows Service `postgresql-x64-18`) |

---

## 3. Getting Started & Installation

### Step 1: Clone Repository & Configure Environment
```bash
# Clone the repository
git clone https://github.com/voltroute/voltroute.git
cd voltroute

# Inspect environment template
# Copy .env.example to .env and adjust variables as required
cp .env.example .env
```

> [!IMPORTANT]
> Never commit `.env` or files containing database passwords, JWT secrets, or API keys to version control. The root [`.gitignore`](file:///.gitignore) strictly excludes all secret and build artifacts.

---

### Step 2: Backend Setup (Spring Boot & PostgreSQL)

```bash
# Navigate to backend directory
cd backend

# Compile code and run automated tests (uses in-memory H2 database)
mvn clean test

# Launch in zero-config local mode (in-memory H2 database)
mvn spring-boot:run

# Or launch with local PostgreSQL instance (voltroute_db)
# Supply POSTGRES_PASSWORD in environment or in .env file
# Windows PowerShell example:
$env:SPRING_PROFILES_ACTIVE="dev"
$env:POSTGRES_PASSWORD="your_postgres_password"
mvn spring-boot:run
```

The backend server starts on `http://localhost:8080`.
* **Health Endpoint**: `http://localhost:8080/api/health`
* **Swagger UI Documentation**: `http://localhost:8080/swagger-ui.html`
* **OpenAPI 3.0 JSON Specification**: `http://localhost:8080/v3/api-docs`
* **Actuator Health Probe**: `http://localhost:8080/actuator/health`
* **H2 Web Console (Local Profile Only)**: `http://localhost:8080/h2-console`

For detailed schema diagrams, entity relationships, and database provisioning steps, see [`docs/DATABASE_DESIGN.md`](file:///docs/DATABASE_DESIGN.md).

---

### Step 3: Frontend Setup (React + Vite)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start the Vite development server
npm run dev
```

The frontend client launches on `http://localhost:5173`.
All requests to `/api/*` are automatically proxied to the backend at `http://localhost:8080` during development.

---

## 4. Available Scripts

### Frontend Scripts (`frontend/package.json`)
* `npm run dev`: Starts local Vite development server with Hot Module Replacement (HMR).
* `npm run build`: Bundles the production application into `frontend/dist/`.
* `npm run test`: Executes frontend unit and integration test suite via Vitest.
* `npm run preview`: Locally previews the production build.
* `npm run lint`: Runs code quality and linting checks via `oxlint`.

### Backend Commands (`backend/pom.xml`)
* `mvn clean compile`: Compiles Java source files with Java 21 compiler.
* `mvn test`: Runs automated test suite (including Health probe, JPA persistence, Security, and Exception handling) using in-memory H2 database.
* `mvn spring-boot:run`: Launches the application locally.
* `mvn package`: Packages the production executable JAR in `backend/target/`.

---

## 5. Development Roadmap & Verification Phases

Development is structured into independently verifiable phases documented in [`docs/IMPLEMENTATION_PLAN.md`](file:///docs/IMPLEMENTATION_PLAN.md):

* **Phase 1: Project Scaffolding & Toolchain Setup** &mdash; **COMPLETED**
* **Phase 2: Database Schema, Persistence & PostgreSQL Integration** &mdash; **COMPLETED**
* **Phase 3: Backend Foundation (Architecture, CORS, Error Handling, OpenAPI & Health)** &mdash; **COMPLETED**
* **Phase 4: Authentication, Authorization & User Profile Management (JWT)** &mdash; **COMPLETED**
* **Phase 5: Station Discovery & Open Charge Map Integration** &mdash; **COMPLETED**
* **Phase 6: Frontend Core UI & Authentication Integration** &mdash; **COMPLETED**
* **Phase 7: Interactive Charging Station Map & Supported Filters** &mdash; **COMPLETED**
* **Phase 8: Persistent, User-Specific Charging Station Favorites** &mdash; **COMPLETED**
* **Phase 9: Intelligent Multi-Stop EV Route Optimization & Energy Engine** &mdash; **COMPLETED**
* **Phase 10: AI/ML Service Integration (FastAPI, Scikit-Learn)** &mdash; Planned
* **Phase 11: End-to-End Integration, Verification & Production Hardening**

For detailed architecture diagrams and data models, see [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md), [`docs/DATABASE_DESIGN.md`](file:///docs/DATABASE_DESIGN.md), [`docs/AUTHENTICATION.md`](file:///docs/AUTHENTICATION.md), [`docs/EXTERNAL_APIS.md`](file:///docs/EXTERNAL_APIS.md), and [`docs/API_DOCUMENTATION.md`](file:///docs/API_DOCUMENTATION.md).
