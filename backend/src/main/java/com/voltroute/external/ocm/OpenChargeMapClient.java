package com.voltroute.external.ocm;

import com.voltroute.common.exception.ExternalApiException;
import com.voltroute.config.OpenChargeMapProperties;
import com.voltroute.external.ocm.dto.OcmPoiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Dedicated HTTP client for communicating with the external Open Charge Map API v3.
 * Manages API keys, query parameter serialization, timeouts, and error handling.
 */
@Component
public class OpenChargeMapClient {

    private static final Logger log = LoggerFactory.getLogger(OpenChargeMapClient.class);
    private static final ParameterizedTypeReference<List<OcmPoiResponse>> POI_LIST_TYPE =
            new ParameterizedTypeReference<>() {};

    private final OpenChargeMapProperties properties;
    private final RestClient restClient;

    @Autowired
    public OpenChargeMapClient(OpenChargeMapProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    /**
     * Package-private constructor for unit testing with custom RestClient instance.
     */
    OpenChargeMapClient(OpenChargeMapProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    /**
     * Queries Open Charge Map for charging stations within a given radius of coordinates.
     */
    public List<OcmPoiResponse> getNearbyStations(Double latitude, Double longitude, Double radiusKm,
                                                 Integer maxResults, Integer connectionTypeId, Double minPowerKw) {
        validateApiKeyConfigured();

        log.debug("Fetching nearby stations from OCM at ({}, {}) within {} km", latitude, longitude, radiusKm);

        return executeRequest(uriBuilder -> {
            uriBuilder.path("/poi/")
                    .queryParam("output", "json")
                    .queryParam("compact", "false")
                    .queryParam("verbose", "false")
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("distance", radiusKm)
                    .queryParam("distanceunit", "KM")
                    .queryParam("maxresults", maxResults != null ? maxResults : 50);

            if (connectionTypeId != null) {
                uriBuilder.queryParam("connectiontypeid", connectionTypeId);
            }
            if (minPowerKw != null && minPowerKw > 0) {
                uriBuilder.queryParam("minpowerkw", minPowerKw);
            }
            return uriBuilder.build();
        });
    }

    /**
     * Queries Open Charge Map for charging stations by ISO country code.
     */
    public List<OcmPoiResponse> getStationsByCountry(String countryCode, Integer maxResults,
                                                    Integer connectionTypeId, Double minPowerKw) {
        validateApiKeyConfigured();

        log.debug("Fetching stations from OCM for countryCode='{}'", countryCode);

        return executeRequest(uriBuilder -> {
            uriBuilder.path("/poi/")
                    .queryParam("output", "json")
                    .queryParam("compact", "false")
                    .queryParam("verbose", "false")
                    .queryParam("countrycode", countryCode)
                    .queryParam("maxresults", maxResults != null ? maxResults : 50);

            if (connectionTypeId != null) {
                uriBuilder.queryParam("connectiontypeid", connectionTypeId);
            }
            if (minPowerKw != null && minPowerKw > 0) {
                uriBuilder.queryParam("minpowerkw", minPowerKw);
            }
            return uriBuilder.build();
        });
    }

    /**
     * Queries Open Charge Map for a single station by its ID.
     */
    public Optional<OcmPoiResponse> getStationById(Long stationId) {
        validateApiKeyConfigured();

        log.debug("Fetching station details from OCM for id={}", stationId);

        List<OcmPoiResponse> results = executeRequest(uriBuilder ->
                uriBuilder.path("/poi/")
                        .queryParam("output", "json")
                        .queryParam("compact", "false")
                        .queryParam("verbose", "false")
                        .queryParam("id", stationId)
                        .build()
        );

        if (results == null || results.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(results.get(0));
    }

    private void validateApiKeyConfigured() {
        if (!StringUtils.hasText(properties.getApiKey())) {
            log.error("Open Charge Map API key is not configured in voltroute.external.open-charge-map.api-key");
            throw new ExternalApiException("Open Charge Map API key is not configured. Please supply OPEN_CHARGE_MAP_API_KEY.");
        }
    }

    private List<OcmPoiResponse> executeRequest(java.util.function.Function<org.springframework.web.util.UriBuilder, java.net.URI> uriFunction) {
        try {
            List<OcmPoiResponse> response = restClient.get()
                    .uri(uriFunction)
                    .header("X-API-Key", properties.getApiKey())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(POI_LIST_TYPE);

            return response != null ? response : Collections.emptyList();
        } catch (ResourceAccessException ex) {
            log.error("Timeout or network error communicating with Open Charge Map: {}", ex.getMessage());
            throw new ExternalApiException("Open Charge Map connection timed out or is unreachable", ex);
        } catch (RestClientResponseException ex) {
            int statusCode = ex.getStatusCode().value();
            log.error("Open Charge Map returned HTTP error {}: {}", statusCode, ex.getResponseBodyAsString());

            if (statusCode == 429) {
                throw new ExternalApiException("Open Charge Map rate limit exceeded. Please try again shortly.");
            } else if (statusCode == 401 || statusCode == 403) {
                throw new ExternalApiException("Open Charge Map rejected API key authentication.");
            } else if (statusCode >= 500) {
                throw new ExternalApiException("Open Charge Map upstream provider error: HTTP " + statusCode);
            } else {
                throw new ExternalApiException("Open Charge Map request error: HTTP " + statusCode + " - " + ex.getStatusText());
            }
        } catch (ExternalApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error querying Open Charge Map: {}", ex.getMessage(), ex);
            throw new ExternalApiException("Unexpected error communicating with Open Charge Map: " + ex.getMessage(), ex);
        }
    }
}
