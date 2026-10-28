# VoltRoute: External APIs & Third-Party Integrations

## 1. Overview & Strategy

VoltRoute interfaces with external third-party mobility platforms to provide EV drivers with up-to-date station discovery, route calculation, and charging telemetry.

Key Architectural Principles:
* **Server-Side API Key Sequestration**: Secret API keys (`OPEN_CHARGE_MAP_API_KEY`, `OPENROUTESERVICE_API_KEY`) are stored and managed exclusively on the Spring Boot backend. Client browsers and mobile applications never receive or store third-party provider keys.
* **On-Demand Federated Queries**: To avoid stale data and comply with provider terms, VoltRoute does not bulk-scrape or store the entire global station dataset in PostgreSQL. Instead, it queries geographic bounding areas on demand.
* **Truthful Data Representation**: Static operational flags from external directories are clearly demarcated from real-time dynamic plug occupancy. If live telemetry is unavailable from the upstream provider, `realTimeOccupancyAvailable` is explicitly set to `false`.
* **Resilience & Fault Isolation**: External HTTP calls are sandboxed with connection and read timeouts. Upstream failures (rate limits, timeouts, 5xx server errors) are translated into standard `ApiErrorResponse` envelopes without cascading internal server errors.

---

## 2. Open Charge Map (OCM) Integration (Phase 5)

[Open Charge Map](https://openchargemap.org/) is a non-commercial, global registry of Electric Vehicle charging locations operated by volunteers, network operators, and data contributors.

### 2.1 Provider Specification
* **API Version**: v3
* **Base URL**: `https://api.openchargemap.io/v3`
* **Primary Resource Endpoint**: `/poi/` (Points of Interest)
* **Protocol**: REST over HTTPS (JSON format)
* **Authentication**: HTTP Header `X-API-Key: <secret_key>`
* **Configuration Properties**:
  * `voltroute.external.open-charge-map.base-url`: Default `https://api.openchargemap.io/v3`
  * `voltroute.external.open-charge-map.api-key`: Injected from `OPEN_CHARGE_MAP_API_KEY`
  * `voltroute.external.open-charge-map.connect-timeout-ms`: Default `5000` ms
  * `voltroute.external.open-charge-map.read-timeout-ms`: Default `10000` ms

### 2.2 Endpoint Query Capabilities

| VoltRoute Query | OCM Query Parameters | Behavior / Notes |
| :--- | :--- | :--- |
| **Nearby Station Search** | `latitude={lat}&longitude={lon}&distance={radiusKm}&distanceunit=KM&maxresults={max}` | Geographic radius query around center point. Coordinates validated between `[-90, 90]` and `[-180, 180]`. Radius bounded between `0.1` and `200.0` km. |
| **City / Town Search** | `countrycode={countryCode}&maxresults={max}` | OCM v3 does **not** provide a native `city` or `town` query parameter in `/poi/`. VoltRoute queries candidate stations within the country and performs case-insensitive filtering against `AddressInfo.Town`. |
| **Station Detail by ID** | `id={stationId}` | Queries single POI record by OCM numeric ID. Empty array response maps to `404 Not Found`. |
| **Connector Standard Filter** | `connectiontypeid={id}` | Filters for specific charging standards (e.g. Type 2, CCS, CHAdeMO, Tesla). |
| **Power Output Filter** | `minpowerkw={minKw}` | Filters for stations with charging rate $\ge$ specified kW (e.g. 50.0 kW for DC Fast Charging). |

### 2.3 Data Transformation & DTO Mapping

VoltRoute standardizes raw OCM schemas into clean, strongly-typed internal DTOs:

```
[ Raw OCM JSON (OcmPoiResponse) ]
        │
        ├── AddressInfo ──────────────► StationLocationDto (lat, lon, address, town, state, country)
        ├── Connections[] ────────────► List<ConnectorDto> (powerKw, voltage, amps, standard, fastCharge)
        ├── OperatorInfo ─────────────► operatorName, operatorWebsite
        └── StatusType ───────────────► operationalStatus ("Operational", "Planned", etc.)
                                      └── realTimeOccupancyAvailable = false
```

#### Key Schema Mappings:
1. **Total Connectors**: Calculated from the sum of `Connections[].Quantity` or `NumberOfPoints`.
2. **Maximum Power**: Evaluated from the maximum `PowerKW` rating present across all connector bays.
3. **Fast Charge Capability**: Determined by OCM `Level.IsFastChargeCapable` or connector rated power $\ge 40.0\text{ kW}$.
4. **Real-Time Availability**: Because Open Charge Map acts primarily as a registry rather than a live telemetry gateway, `realTimeOccupancyAvailable` is strictly maintained as `false` to avoid misleading drivers.

---

## 3. Resilience, Timeout & Rate Limit Handling

### 3.1 Network Timeouts
Outbound calls use Spring's `RestClient` configured with `SimpleClientHttpRequestFactory`:
* Connection timeout: 5 seconds.
* Read timeout: 10 seconds.
* In the event of a timeout or connection failure (`ResourceAccessException`), `OpenChargeMapClient` catches the error and throws an `ExternalApiException("Open Charge Map connection timed out or is unreachable")`, converted to `502 Bad Gateway`.

### 3.2 HTTP Status Translation Matrix

| Provider Status | Upstream Scenario | VoltRoute Internal Exception | API Response to Client |
| :--- | :--- | :--- | :--- |
| `HTTP 200` | Matching records returned | &mdash; | `200 OK` + `ApiResponse<List<StationSummaryDto>>` |
| `HTTP 200` | No records in radius | &mdash; | `200 OK` + `ApiResponse<[]>` (Empty list) |
| `HTTP 401 / 403` | Invalid or rejected API key | `ExternalApiException` | `502 Bad Gateway` + `"Open Charge Map rejected API key authentication."` |
| `HTTP 429` | Upstream rate limit exceeded | `ExternalApiException` | `502 Bad Gateway` + `"Open Charge Map rate limit exceeded. Please try again shortly."` |
| `HTTP 5xx` | Provider server outage | `ExternalApiException` | `502 Bad Gateway` + `"Open Charge Map upstream provider error: HTTP 5xx"` |
| Network Timeout | Socket connect/read timeout | `ExternalApiException` | `502 Bad Gateway` + `"Open Charge Map connection timed out or is unreachable"` |

---

## 4. OpenRouteService (ORS) Integration (Phase 9)

[OpenRouteService](https://openrouteservice.org/) is an open-source geographic routing engine built upon OpenStreetMap data, providing road network directions, distance matrixes, and isochrones.

### 4.1 Provider Specification
* **API Version**: v2
* **Base URL**: `https://api.openrouteservice.org`
* **Primary Resource Endpoint**: `/v2/directions/driving-car/geojson`
* **Protocol**: REST over HTTPS (JSON/GeoJSON format)
* **Authentication**: HTTP Header `Authorization: <api_key>`
* **Configuration Properties**:
  * `voltroute.external.open-route-service.base-url`: Default `https://api.openrouteservice.org`
  * `voltroute.external.open-route-service.api-key`: Injected from `OPENROUTESERVICE_API_KEY`
  * `voltroute.external.open-route-service.connect-timeout-ms`: Default `5000` ms
  * `voltroute.external.open-route-service.read-timeout-ms`: Default `10000` ms

### 4.2 Coordinate System & Formatting Conventions
* **GeoJSON Longitude-First Standard**: OpenRouteService strictly expects coordinates ordered as `[longitude, latitude]`.
* **Frontend LatLng Conversion**: The backend [`RouteServiceImpl`](file:///backend/src/main/java/com/voltroute/modules/route/service/RouteServiceImpl.java) translates coordinates from GeoJSON `[lon, lat]` into Leaflet's standard `[latitude, longitude]` array pairs before returning to the web client.

### 4.3 Error Handling & HTTP Status Translation Matrix

| Provider Status | Upstream Scenario | VoltRoute Internal Exception | API Response to Client |
| :--- | :--- | :--- | :--- |
| `HTTP 200` | Viable route found | &mdash; | `200 OK` + `ApiResponse<RoutePlanResponse>` |
| `HTTP 400 / 404` | Invalid coordinates or unroutable path | `ExternalApiException` | `502 Bad Gateway` + `"OpenRouteService route calculation failed: invalid coordinates or unroutable driving path."` |
| `HTTP 401 / 403` | Missing or rejected API key | `ExternalApiException` | `502 Bad Gateway` + `"OpenRouteService rejected API key authentication."` |
| `HTTP 429` | Upstream rate limit exceeded | `ExternalApiException` | `502 Bad Gateway` + `"OpenRouteService rate limit exceeded. Please try again shortly."` |
| `HTTP 5xx` | Provider server outage | `ExternalApiException` | `502 Bad Gateway` + `"OpenRouteService upstream provider error: HTTP 5xx"` |
| Network Timeout | Socket connect/read timeout | `ExternalApiException` | `502 Bad Gateway` + `"OpenRouteService connection timed out or is unreachable"` |

---

## 5. Planned External Integrations (Roadmap)

1. **AI/ML Queue Prediction Microservice (Phase 10)**:
   * Local FastAPI service (`http://localhost:8000`) predicting wait times and non-linear battery charging curves.
