package com.voltroute;

import com.voltroute.common.exception.ExternalApiException;
import com.voltroute.external.ocm.OpenChargeMapClient;
import com.voltroute.external.ocm.dto.*;
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
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OpenChargeMapClient openChargeMapClient;

    private OcmPoiResponse createSamplePoi() {
        return OcmPoiResponse.builder()
                .id(2001L)
                .uuid("UUID-2001")
                .addressInfo(OcmAddressInfo.builder()
                        .title("San Francisco Supercharger")
                        .latitude(37.7749)
                        .longitude(-122.4194)
                        .town("San Francisco")
                        .addressLine1("Market St")
                        .country(OcmCountry.builder().isoCode("US").title("United States").build())
                        .build())
                .operatorInfo(OcmOperatorInfo.builder().title("Tesla").build())
                .statusType(OcmStatusType.builder().title("Operational").build())
                .connections(List.of(
                        OcmConnection.builder()
                                .id(10L)
                                .powerKw(250.0)
                                .quantity(8)
                                .connectionType(OcmConnectionType.builder().title("Tesla").build())
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("GET /api/stations - Valid coordinates returns 200 OK with station list")
    void getNearbyStations_shouldReturn200WithStations() throws Exception {
        when(openChargeMapClient.getNearbyStations(eq(37.7749), eq(-122.4194), eq(10.0), anyInt(), isNull(), isNull()))
                .thenReturn(List.of(createSamplePoi()));

        mockMvc.perform(get("/api/stations")
                        .param("latitude", "37.7749")
                        .param("longitude", "-122.4194")
                        .param("radiusKm", "10.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(2001))
                .andExpect(jsonPath("$.data[0].title").value("San Francisco Supercharger"))
                .andExpect(jsonPath("$.data[0].location.city").value("San Francisco"))
                .andExpect(jsonPath("$.data[0].realTimeOccupancyAvailable").value(false));
    }

    @Test
    @DisplayName("GET /api/stations - Missing coordinates returns 400 Bad Request")
    void getNearbyStations_shouldReturn400WhenCoordinatesMissing() throws Exception {
        mockMvc.perform(get("/api/stations")
                        .param("radiusKm", "10.0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message", containsString("Coordinates (latitude and longitude) are required")));
    }

    @Test
    @DisplayName("GET /api/stations - Invalid coordinates returns 400 Bad Request")
    void getNearbyStations_shouldReturn400WhenCoordinatesInvalid() throws Exception {
        mockMvc.perform(get("/api/stations")
                        .param("latitude", "120.0")
                        .param("longitude", "-122.4194"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("GET /api/stations - Invalid radius returns 400 Bad Request")
    void getNearbyStations_shouldReturn400WhenRadiusInvalid() throws Exception {
        mockMvc.perform(get("/api/stations")
                        .param("latitude", "37.7749")
                        .param("longitude", "-122.4194")
                        .param("radiusKm", "500.0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("GET /api/stations - External provider failure returns 502 Bad Gateway")
    void getNearbyStations_shouldReturn502OnProviderError() throws Exception {
        when(openChargeMapClient.getNearbyStations(anyDouble(), anyDouble(), anyDouble(), anyInt(), any(), any()))
                .thenThrow(new ExternalApiException("Open Charge Map upstream provider error: HTTP 500"));

        mockMvc.perform(get("/api/stations")
                        .param("latitude", "37.7749")
                        .param("longitude", "-122.4194"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(502))
                .andExpect(jsonPath("$.error").value("Bad Gateway"))
                .andExpect(jsonPath("$.message", containsString("Open Charge Map upstream provider error")));
    }

    @Test
    @DisplayName("GET /api/stations/search - Valid city search returns 200 OK")
    void searchStations_shouldReturn200WithCityMatches() throws Exception {
        when(openChargeMapClient.getStationsByCountry(eq("US"), anyInt(), any(), any()))
                .thenReturn(List.of(createSamplePoi()));

        mockMvc.perform(get("/api/stations/search")
                        .param("city", "San Francisco")
                        .param("countryCode", "US"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].location.city").value("San Francisco"));
    }

    @Test
    @DisplayName("GET /api/stations/search - Missing city returns 400 Bad Request")
    void searchStations_shouldReturn400WhenCityMissing() throws Exception {
        mockMvc.perform(get("/api/stations/search")
                        .param("city", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("GET /api/stations/{stationId} - Existing station returns 200 OK with details")
    void getStationById_shouldReturn200WithDetails() throws Exception {
        when(openChargeMapClient.getStationById(2001L)).thenReturn(Optional.of(createSamplePoi()));

        mockMvc.perform(get("/api/stations/2001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(2001))
                .andExpect(jsonPath("$.data.title").value("San Francisco Supercharger"))
                .andExpect(jsonPath("$.data.connectors", hasSize(1)))
                .andExpect(jsonPath("$.data.connectors[0].powerKw").value(250.0));
    }

    @Test
    @DisplayName("GET /api/stations/{stationId} - Unknown station returns 404 Not Found")
    void getStationById_shouldReturn404WhenNotFound() throws Exception {
        when(openChargeMapClient.getStationById(9999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/stations/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message", containsString("Station not found with id: '9999'")));
    }
}
