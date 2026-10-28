package com.voltroute.external.ors;

import com.voltroute.common.exception.ExternalApiException;
import com.voltroute.config.OpenRouteServiceProperties;
import com.voltroute.external.ors.dto.OrsDirectionsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * Dedicated backend HTTP client for communicating with the external OpenRouteService API.
 * Encapsulates credentials, request dispatch, timeouts, and upstream error translation.
 */
@Component
@Slf4j
public class OpenRouteServiceClient {

    private final OpenRouteServiceProperties properties;
    private final RestClient restClient;

    @Autowired
    public OpenRouteServiceClient(OpenRouteServiceProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    /**
     * Constructor for testing with mock or customized RestClient.
     */
    OpenRouteServiceClient(OpenRouteServiceProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    /**
     * Queries OpenRouteService driving-car directions between origin and destination coordinates.
     * Note: OpenRouteService expects coordinates in GeoJSON [longitude, latitude] ordering.
     */
    public OrsDirectionsResponse getDrivingRoute(Double originLat, Double originLon,
                                                Double destLat, Double destLon) {
        validateApiKeyConfigured();

        log.debug("Requesting ORS driving route from ({}, {}) to ({}, {})",
                originLat, originLon, destLat, destLon);

        Map<String, Object> requestBody = Map.of(
                "coordinates", List.of(
                        List.of(originLon, originLat),
                        List.of(destLon, destLat)
                ),
                "instructions", false,
                "preference", "recommended"
        );

        try {
            OrsDirectionsResponse response = restClient.post()
                    .uri("/v2/directions/driving-car/geojson")
                    .header("Authorization", properties.getApiKey())
                    .header("Accept", "application/geo+json, application/gpx+xml, img/png; charset=utf-8")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(OrsDirectionsResponse.class);

            if (response == null || response.getFeatures() == null || response.getFeatures().isEmpty()) {
                log.warn("OpenRouteService returned empty features for route ({}, {}) -> ({}, {})",
                        originLat, originLon, destLat, destLon);
                throw new ExternalApiException("OpenRouteService could not find a viable driving route between these locations.");
            }

            return response;
        } catch (ResourceAccessException ex) {
            log.error("Timeout or network error communicating with OpenRouteService: {}", ex.getMessage());
            throw new ExternalApiException("OpenRouteService connection timed out or is unreachable", ex);
        } catch (RestClientResponseException ex) {
            int statusCode = ex.getStatusCode().value();
            log.error("OpenRouteService returned HTTP {}: {}", statusCode, ex.getResponseBodyAsString());

            if (statusCode == 429) {
                throw new ExternalApiException("OpenRouteService rate limit exceeded. Please try again shortly.");
            } else if (statusCode == 401 || statusCode == 403) {
                throw new ExternalApiException("OpenRouteService rejected API key authentication.");
            } else if (statusCode == 400 || statusCode == 404) {
                throw new ExternalApiException("OpenRouteService route calculation failed: invalid coordinates or unroutable driving path.");
            } else if (statusCode >= 500) {
                throw new ExternalApiException("OpenRouteService upstream provider error: HTTP " + statusCode);
            } else {
                throw new ExternalApiException("OpenRouteService request error: HTTP " + statusCode + " - " + ex.getStatusText());
            }
        } catch (ExternalApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error querying OpenRouteService: {}", ex.getMessage(), ex);
            throw new ExternalApiException("Unexpected error communicating with OpenRouteService: " + ex.getMessage(), ex);
        }
    }

    private void validateApiKeyConfigured() {
        if (!StringUtils.hasText(properties.getApiKey())) {
            log.error("OpenRouteService API key is not configured in voltroute.external.open-route-service.api-key");
            throw new ExternalApiException("OpenRouteService API key is not configured. Please supply OPENROUTESERVICE_API_KEY.");
        }
    }
}
