package com.voltroute.client;

import com.voltroute.dto.StationFilterRequest;
import com.voltroute.dto.StationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenChargeMapClient {

    private final RestClient restClient;

    @Value("${api.openchargemap.base-url}")
    private String baseUrl;

    @Value("${api.openchargemap.key}")
    private String apiKey;

    public List<StationResponse> getNearbyStations(Double latitude, Double longitude, Double distanceKm) {
        String url = String.format("%s/poi?key=%s&latitude=%s&longitude=%s&distance=%s&distanceunit=km&maxresults=50",
                baseUrl, apiKey, latitude, longitude, distanceKm);

        try {
            // Note: In a real implementation, you would map to OpenChargeMap's specific response structure,
            // then convert it to your StationResponse DTO. Here we simplify for illustration.
            return restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<StationResponse>>() {});
        } catch (Exception e) {
            log.error("Error fetching nearby stations", e);
            throw new RuntimeException("Failed to fetch charging stations from OpenChargeMap API");
        }
    }

    public List<StationResponse> searchStations(StationFilterRequest filter) {
        // Construct URL based on filter parameters
        StringBuilder urlBuilder = new StringBuilder(baseUrl)
                .append("/poi?key=").append(apiKey)
                .append("&maxresults=").append(filter.getLimit());

        if (filter.getLatitude() != null && filter.getLongitude() != null) {
            urlBuilder.append("&latitude=").append(filter.getLatitude())
                      .append("&longitude=").append(filter.getLongitude())
                      .append("&distance=").append(filter.getDistanceKm())
                      .append("&distanceunit=km");
        } else if (filter.getCity() != null) {
            urlBuilder.append("&town=").append(filter.getCity());
        }

        try {
            return restClient.get()
                    .uri(urlBuilder.toString())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<StationResponse>>() {});
        } catch (Exception e) {
            log.error("Error searching stations", e);
            throw new RuntimeException("Failed to search charging stations");
        }
    }

    public StationResponse getStationById(String stationId) {
        String url = String.format("%s/poi?key=%s&chargepointid=%s", baseUrl, apiKey, stationId);

        try {
            List<StationResponse> result = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<StationResponse>>() {});
            
            if (result != null && !result.isEmpty()) {
                return result.get(0);
            }
            return null;
        } catch (Exception e) {
            log.error("Error fetching station details", e);
            throw new RuntimeException("Failed to fetch station details");
        }
    }
}
