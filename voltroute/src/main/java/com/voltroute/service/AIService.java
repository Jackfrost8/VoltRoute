package com.voltroute.service;

import com.voltroute.dto.* ;

public interface AIService {
    TravelPredictionResponse getTravelTime(TravelPredictionRequest request);
    DemandPredictionResponse getDemand(DemandPredictionRequest request);
    RouteOptimizationResponse getRoute(RouteOptimizationRequest request);
}
