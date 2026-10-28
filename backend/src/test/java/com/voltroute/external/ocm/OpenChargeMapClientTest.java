package com.voltroute.external.ocm;

import com.voltroute.common.exception.ExternalApiException;
import com.voltroute.config.OpenChargeMapProperties;
import com.voltroute.external.ocm.dto.OcmPoiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class OpenChargeMapClientTest {

    private OpenChargeMapProperties properties;
    private MockRestServiceServer mockServer;
    private OpenChargeMapClient client;

    private static final String SAMPLE_JSON = """
            [
              {
                "ID": 1001,
                "UUID": "SAMPLE-UUID-1",
                "AddressInfo": {
                  "Title": "Central Fast Charger",
                  "Latitude": 37.7749,
                  "Longitude": -122.4194,
                  "Town": "San Francisco",
                  "Country": {
                    "ISOCode": "US",
                    "Title": "United States"
                  }
                },
                "Connections": [
                  {
                    "ID": 501,
                    "PowerKW": 150.0,
                    "Quantity": 4,
                    "ConnectionType": {
                      "ID": 33,
                      "Title": "CCS (Type 2)"
                    }
                  }
                ],
                "StatusType": {
                  "ID": 50,
                  "Title": "Operational"
                }
              }
            ]
            """;

    @BeforeEach
    void setUp() {
        properties = new OpenChargeMapProperties();
        properties.setBaseUrl("https://api.openchargemap.io/v3");
        properties.setApiKey("test-api-key-12345");
        properties.setConnectTimeoutMs(2000);
        properties.setReadTimeoutMs(3000);

        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        client = new OpenChargeMapClient(properties, builder);
    }

    @Test
    @DisplayName("getNearbyStations - Successful request returns deserialized POI list")
    void getNearbyStations_shouldReturnPoiListOnSuccess() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("/poi/")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("X-API-Key", "test-api-key-12345"))
                .andRespond(withSuccess(SAMPLE_JSON, MediaType.APPLICATION_JSON));

        List<OcmPoiResponse> results = client.getNearbyStations(37.7749, -122.4194, 15.0, 50, null, null);

        assertThat(results).hasSize(1);
        OcmPoiResponse poi = results.get(0);
        assertThat(poi.getId()).isEqualTo(1001L);
        assertThat(poi.getAddressInfo().getTitle()).isEqualTo("Central Fast Charger");
        assertThat(poi.getConnections().get(0).getPowerKw()).isEqualTo(150.0);
        mockServer.verify();
    }

    @Test
    @DisplayName("getNearbyStations - Empty JSON array returns empty list without error")
    void getNearbyStations_shouldHandleEmptyResponse() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("/poi/")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        List<OcmPoiResponse> results = client.getNearbyStations(37.7749, -122.4194, 10.0, 50, null, null);

        assertThat(results).isEmpty();
        mockServer.verify();
    }

    @Test
    @DisplayName("getStationById - Existing ID returns Optional with POI")
    void getStationById_shouldReturnStationWhenFound() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("id=1001")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(SAMPLE_JSON, MediaType.APPLICATION_JSON));

        Optional<OcmPoiResponse> result = client.getStationById(1001L);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1001L);
        mockServer.verify();
    }

    @Test
    @DisplayName("getStationById - Empty array returns Optional.empty()")
    void getStationById_shouldReturnEmptyWhenNotFound() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("id=9999")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        Optional<OcmPoiResponse> result = client.getStationById(9999L);

        assertThat(result).isEmpty();
        mockServer.verify();
    }

    @Test
    @DisplayName("OpenChargeMapClient - Missing API key throws ExternalApiException")
    void client_shouldThrowWhenApiKeyMissing() {
        properties.setApiKey("");

        assertThatThrownBy(() -> client.getNearbyStations(37.7749, -122.4194, 10.0, 50, null, null))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("Open Charge Map API key is not configured");
    }

    @Test
    @DisplayName("OpenChargeMapClient - Upstream 500 error throws ExternalApiException")
    void client_shouldHandleServerError() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("/poi/")))
                .andRespond(withServerError());

        assertThatThrownBy(() -> client.getNearbyStations(37.7749, -122.4194, 10.0, 50, null, null))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("Open Charge Map upstream provider error: HTTP 500");
    }

    @Test
    @DisplayName("OpenChargeMapClient - Rate limit 429 error throws ExternalApiException with clear guidance")
    void client_shouldHandleRateLimit() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.containsString("/poi/")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThatThrownBy(() -> client.getNearbyStations(37.7749, -122.4194, 10.0, 50, null, null))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("rate limit exceeded");
    }
}
