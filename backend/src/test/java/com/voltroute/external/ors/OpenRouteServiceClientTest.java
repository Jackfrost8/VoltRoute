package com.voltroute.external.ors;

import com.voltroute.common.exception.ExternalApiException;
import com.voltroute.config.OpenRouteServiceProperties;
import com.voltroute.external.ors.dto.OrsDirectionsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class OpenRouteServiceClientTest {

    private OpenRouteServiceProperties properties;
    private MockRestServiceServer mockServer;
    private OpenRouteServiceClient client;

    private static final String SAMPLE_ORS_GEOJSON = """
            {
              "type": "FeatureCollection",
              "bbox": [-122.4194, 37.7749, -121.4944, 38.5816],
              "features": [
                {
                  "type": "Feature",
                  "properties": {
                    "summary": {
                      "distance": 140000.0,
                      "duration": 5400.0
                    }
                  },
                  "geometry": {
                    "type": "LineString",
                    "coordinates": [
                      [-122.4194, 37.7749],
                      [-121.95, 38.15],
                      [-121.4944, 38.5816]
                    ]
                  }
                }
              ]
            }
            """;

    @BeforeEach
    void setUp() {
        properties = new OpenRouteServiceProperties();
        properties.setBaseUrl("https://api.openrouteservice.org");
        properties.setApiKey("test-ors-key-12345");
        properties.setConnectTimeoutMs(2000);
        properties.setReadTimeoutMs(3000);

        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        client = new OpenRouteServiceClient(properties, builder);
    }

    @Test
    @DisplayName("Throws ExternalApiException when OPENROUTESERVICE_API_KEY is not configured")
    void getDrivingRoute_missingApiKey_throwsExternalApiException() {
        properties.setApiKey("");

        assertThatThrownBy(() -> client.getDrivingRoute(37.77, -122.41, 38.58, -121.49))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("OpenRouteService API key is not configured");
    }

    @Test
    @DisplayName("Successful 200 OK returns parsed GeoJSON directions response with summary and coordinates")
    void getDrivingRoute_success() {
        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "test-ors-key-12345"))
                .andRespond(withSuccess(SAMPLE_ORS_GEOJSON, MediaType.APPLICATION_JSON));

        OrsDirectionsResponse response = client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944);

        assertThat(response).isNotNull();
        assertThat(response.getFeatures()).hasSize(1);
        assertThat(response.getFeatures().get(0).getProperties().getSummary().getDistance()).isEqualTo(140000.0);
        assertThat(response.getFeatures().get(0).getProperties().getSummary().getDuration()).isEqualTo(5400.0);
        assertThat(response.getFeatures().get(0).getGeometry().getCoordinates()).hasSize(3);
        mockServer.verify();
    }

    @Test
    @DisplayName("Empty features array throws ExternalApiException indicating no route could be found")
    void getDrivingRoute_emptyFeatures_throwsExternalApiException() {
        String emptyFeaturesJson = """
                {
                  "type": "FeatureCollection",
                  "features": []
                }
                """;

        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(emptyFeaturesJson, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("could not find a viable driving route");

        mockServer.verify();
    }

    @Test
    @DisplayName("HTTP 400 Bad Request from ORS throws ExternalApiException for unroutable path or coordinates")
    void getDrivingRoute_http400_throwsExternalApiException() {
        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withBadRequest().body("{\"error\": \"Could not find point within 350m\"}"));

        assertThatThrownBy(() -> client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("invalid coordinates or unroutable driving path");

        mockServer.verify();
    }

    @Test
    @DisplayName("HTTP 401 / 403 from ORS throws ExternalApiException for unauthorized / rejected API key")
    void getDrivingRoute_http401_throwsExternalApiException() {
        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Unauthorized\"}"));

        assertThatThrownBy(() -> client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("rejected API key authentication");

        mockServer.verify();
    }

    @Test
    @DisplayName("HTTP 429 from ORS throws ExternalApiException for rate limit exceeded")
    void getDrivingRoute_http429_throwsExternalApiException() {
        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).body("{\"error\": \"Rate limit exceeded\"}"));

        assertThatThrownBy(() -> client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("rate limit exceeded");

        mockServer.verify();
    }

    @Test
    @DisplayName("HTTP 500 from ORS throws ExternalApiException for upstream provider failure")
    void getDrivingRoute_http500_throwsExternalApiException() {
        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError().body("{\"error\": \"Internal server error\"}"));

        assertThatThrownBy(() -> client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("upstream provider error: HTTP 500");

        mockServer.verify();
    }

    @Test
    @DisplayName("Socket timeout / network error throws ExternalApiException indicating unreachable provider")
    void getDrivingRoute_timeout_throwsExternalApiException() {
        mockServer.expect(requestTo(containsString("/v2/directions/driving-car/geojson")))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.getDrivingRoute(37.7749, -122.4194, 38.5816, -121.4944))
                .isInstanceOf(ExternalApiException.class)
                .hasMessageContaining("timed out or is unreachable");

        mockServer.verify();
    }
}
