package com.voltroute.service.impl;

import com.voltroute.client.AIClient;
import com.voltroute.dto.*;
import com.voltroute.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private final AIClient aiClient;

    @Override
    public TravelPredictionResponse getTravelTime(TravelPredictionRequest request) {
        return aiClient.getTravelTimePrediction(request);
    }

    @Override
    public DemandPredictionResponse getDemand(DemandPredictionRequest request) {
        return aiClient.getDemandPrediction(request);
    }

    @Override
    public RouteOptimizationResponse getRoute(RouteOptimizationRequest request) {
        return aiClient.getOptimizedRoute(request);
    }
}
