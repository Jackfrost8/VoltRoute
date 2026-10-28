package com.voltroute;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltroute.common.exception.ExternalApiException;
import com.voltroute.external.ors.OpenRouteServiceClient;
import com.voltroute.external.ors.dto.*;
import com.voltroute.modules.route.dto.RoutePlanRequest;
import com.voltroute.modules.station.dto.StationLocationDto;
import com.voltroute.modules.station.dto.StationSearchFilter;
import com.voltroute.modules.station.dto.StationSummaryDto;
import com.voltroute.modules.station.service.StationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoutePlanningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OpenRouteServiceClient openRouteServiceClient;

    @MockitoBean
    private StationService stationService;

    private OrsDirectionsResponse sampleOrsResponse;

    @BeforeEach
    void setUp() {
        // Sample route from SF (37.7749, -122.4194) to Sacramento (38.5816, -121.4944) ~ 140 km
        sampleOrsResponse = OrsDirectionsResponse.builder()
                .type("FeatureCollection")
                .features(List.of(
                        OrsFeature.builder()
                                .type("Feature")
                                .geometry(OrsGeometry.builder()
                                        .type("LineString")
                                        .coordinates(List.of(
                                                List.of(-122.4194, 37.7749), // SF (lon, lat)
                                                List.of(-122.0400, 38.2500), // Fairfield midpoint (lon, lat)
                                                List.of(-121.4944, 38.5816)  // Sacramento (lon, lat)
                                        ))
                                        .build())
                                .properties(OrsProperties.builder()
                                        .summary(OrsSummary.builder()
                                                .distance(140000.0) // 140 km
                                                .duration(5400.0)   // 90 minutes
                                                .build())
                                        .build())
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("POST /api/routes/plan: Successfully returns route geometry, telemetry, and candidate stops")
    void planRoute_validRequest_returnsGeometryAndCandidates() throws Exception {
        when(openRouteServiceClient.getDrivingRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(sampleOrsResponse);

        StationSummaryDto midpointStation = StationSummaryDto.builder()
                .id(101L)
                .title("Fairfield Fast Supercharger")
                .operatorName("Tesla")
                .location(StationLocationDto.builder()
                        .latitude(38.2505)
                        .longitude(-122.0405)
                        .addressLine1("123 Cordelia Rd")
                        .city("Fairfield")
                        .stateOrProvince("CA")
                        .countryCode("US")
                        .build())
                .maxPowerKw(250.0)
                .totalConnectors(8)
                .operationalStatus("Operational")
                .connectorTypes(List.of("Tesla", "CCS"))
                .build();

        when(stationService.getNearbyStations(org.mockito.ArgumentMatchers.any(StationSearchFilter.class)))
                .thenReturn(List.of(midpointStation));

        RoutePlanRequest request = RoutePlanRequest.builder()
                .originLatitude(37.7749)
                .originLongitude(-122.4194)
                .originName("San Francisco, CA")
                .destinationLatitude(38.5816)
                .destinationLongitude(-121.4944)
                .destinationName("Sacramento, CA")
                .vehicleRangeKm(300.0)
                .currentBatteryPercent(80.0) // usable range = 240 km > 140 km -> feasible direct
                .connectorType("CCS")
                .build();

        mockMvc.perform(post("/api/routes/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.distanceKm", is(140.0)))
                .andExpect(jsonPath("$.data.durationMinutes", is(90.0)))
                .andExpect(jsonPath("$.data.geometry", hasSize(3)))
                // Verify Leaflet lat/lon conversion: [37.7749, -122.4194]
                .andExpect(jsonPath("$.data.geometry[0][0]", is(37.7749)))
                .andExpect(jsonPath("$.data.geometry[0][1]", is(-122.4194)))
                .andExpect(jsonPath("$.data.feasibility", is("FEASIBLE_DIRECT")))
                .andExpect(jsonPath("$.data.isChargingRequired", is(false)))
                .andExpect(jsonPath("$.data.allCandidateStops", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.allCandidateStops[0].station.id", is(101)))
                .andExpect(jsonPath("$.data.feasibilityNotice", containsString("Deterministic range estimate")));
    }

    @Test
    @DisplayName("POST /api/routes/plan: Charging stop recommended when route exceeds vehicle range")
    void planRoute_chargingRequired_recommendsStopWithinReachableWindow() throws Exception {
        when(openRouteServiceClient.getDrivingRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(sampleOrsResponse);

        // Fairfield station located at ~65km along route
        StationSummaryDto waypointStation = StationSummaryDto.builder()
                .id(202L)
                .title("Vacaville DC Fast Hub")
                .maxPowerKw(150.0)
                .totalConnectors(4)
                .operationalStatus("Operational")
                .location(StationLocationDto.builder()
                        .latitude(38.2500)
                        .longitude(-122.0400)
                        .build())
                .connectorTypes(List.of("CCS"))
                .build();

        when(stationService.getNearbyStations(org.mockito.ArgumentMatchers.any(StationSearchFilter.class)))
                .thenReturn(List.of(waypointStation));

        // Total distance: 140km, current range: 300km * 30% = 90km < 140km -> Charging required!
        RoutePlanRequest request = RoutePlanRequest.builder()
                .originLatitude(37.7749)
                .originLongitude(-122.4194)
                .destinationLatitude(38.5816)
                .destinationLongitude(-121.4944)
                .vehicleRangeKm(300.0)
                .currentBatteryPercent(30.0) // 90 km usable range
                .connectorType("CCS")
                .build();

        mockMvc.perform(post("/api/routes/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isChargingRequired", is(true)))
                .andExpect(jsonPath("$.data.feasibility", is("FEASIBLE_WITH_STOPS")))
                .andExpect(jsonPath("$.data.estimatedStopsNeeded", is(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.recommendedStops", hasSize(1)))
                .andExpect(jsonPath("$.data.recommendedStops[0].station.id", is(202)))
                .andExpect(jsonPath("$.data.recommendedStops[0].recommendedStop", is(true)));
    }

    @Test
    @DisplayName("POST /api/routes/plan: No candidate stations returns RANGE_CONSTRAINED_NO_STOPS_FOUND")
    void planRoute_noStationsAvailable_returnsRangeConstrainedNotice() throws Exception {
        when(openRouteServiceClient.getDrivingRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(sampleOrsResponse);

        // No charging stations found along corridor
        when(stationService.getNearbyStations(org.mockito.ArgumentMatchers.any(StationSearchFilter.class)))
                .thenReturn(List.of());

        RoutePlanRequest request = RoutePlanRequest.builder()
                .originLatitude(37.7749)
                .originLongitude(-122.4194)
                .destinationLatitude(38.5816)
                .destinationLongitude(-121.4944)
                .vehicleRangeKm(100.0)
                .currentBatteryPercent(50.0) // 50 km usable vs 140 km route
                .build();

        mockMvc.perform(post("/api/routes/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.feasibility", is("RANGE_CONSTRAINED_NO_STOPS_FOUND")))
                .andExpect(jsonPath("$.data.allCandidateStops", hasSize(0)))
                .andExpect(jsonPath("$.data.recommendedStops", hasSize(0)));
    }

    @Test
    @DisplayName("POST /api/routes/plan: Invalid coordinates returns 400 Bad Request")
    void planRoute_invalidCoordinates_returns400() throws Exception {
        // Latitude > 90
        RoutePlanRequest invalidLat = RoutePlanRequest.builder()
                .originLatitude(95.0)
                .originLongitude(-122.0)
                .destinationLatitude(38.0)
                .destinationLongitude(-121.0)
                .build();

        mockMvc.perform(post("/api/routes/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLat)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.originLatitude", notNullValue()));

        // Identical origin and destination
        RoutePlanRequest identicalCoords = RoutePlanRequest.builder()
                .originLatitude(37.7749)
                .originLongitude(-122.4194)
                .destinationLatitude(37.7749)
                .destinationLongitude(-122.4194)
                .build();

        mockMvc.perform(post("/api/routes/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(identicalCoords)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Origin and destination coordinates cannot be identical")));
    }

    @Test
    @DisplayName("POST /api/routes/plan: Routing provider failure returns 502 Bad Gateway")
    void planRoute_providerFailure_returns502() throws Exception {
        when(openRouteServiceClient.getDrivingRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenThrow(new ExternalApiException("OpenRouteService connection timed out or is unreachable"));

        RoutePlanRequest request = RoutePlanRequest.builder()
                .originLatitude(37.7749)
                .originLongitude(-122.4194)
                .destinationLatitude(38.5816)
                .destinationLongitude(-121.4944)
                .build();

        mockMvc.perform(post("/api/routes/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status", is(502)))
                .andExpect(jsonPath("$.message", containsString("OpenRouteService connection timed out")));
    }
}
