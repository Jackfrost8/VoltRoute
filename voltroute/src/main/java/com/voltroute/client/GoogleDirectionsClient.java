package com.voltroute.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleDirectionsClient {

    private final RestClient restClient;

    @Value("${api.google-maps.base-url}")
    private String baseUrl;

    @Value("${api.google-maps.key}")
    private String apiKey;

    public String getDirections(String origin, String destination) {
        String url = String.format("%s/directions/json?origin=%s&destination=%s&key=%s",
                baseUrl, origin, destination, apiKey);

        try {
            return restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Error fetching directions from Google Maps API", e);
            throw new RuntimeException("Failed to fetch directions");
        }
    }
}
