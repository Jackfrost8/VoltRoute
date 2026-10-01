package com.voltroute.client;

import com.voltroute.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIClient {

    private final RestClient restClient;

    @Value("${api.ai-service.base-url}")
    private String baseUrl;

    public TravelPredictionResponse getTravelTimePrediction(TravelPredictionRequest request) {
        try {
            return restClient.post()
                    .uri(baseUrl + "/travel-time")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(TravelPredictionResponse.class);
        } catch (Exception e) {
            log.error("Error connecting to AI service for travel time", e);
            throw new RuntimeException("AI Service is currently unavailable");
        }
    }

    public DemandPredictionResponse getDemandPrediction(DemandPredictionRequest request) {
        try {
            return restClient.post()
                    .uri(baseUrl + "/demand")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(DemandPredictionResponse.class);
        } catch (Exception e) {
            log.error("Error connecting to AI service for demand prediction", e);
            throw new RuntimeException("AI Service is currently unavailable");
        }
    }

    public RouteOptimizationResponse getOptimizedRoute(RouteOptimizationRequest request) {
        try {
            return restClient.post()
                    .uri(baseUrl + "/route")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(RouteOptimizationResponse.class);
        } catch (Exception e) {
            log.error("Error connecting to AI service for route optimization", e);
            throw new RuntimeException("AI Service is currently unavailable");
        }
    }
}
