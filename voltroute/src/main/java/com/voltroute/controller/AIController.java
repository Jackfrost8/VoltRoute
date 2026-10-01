package com.voltroute.controller;

import com.voltroute.dto.*;
import com.voltroute.response.ApiResponse;
import com.voltroute.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Features", description = "AI Integration APIs")
public class AIController {

    private final AIService aiService;

    @PostMapping("/travel-time")
    @Operation(summary = "Predict travel time using AI")
    public ResponseEntity<ApiResponse<TravelPredictionResponse>> getTravelTimePrediction(
            @Valid @RequestBody TravelPredictionRequest request) {
        
        TravelPredictionResponse response = aiService.getTravelTime(request);
        return ResponseEntity.ok(ApiResponse.<TravelPredictionResponse>builder()
                .success(true)
                .message("Travel prediction retrieved successfully")
                .data(response)
                .build());
    }

    @PostMapping("/demand")
    @Operation(summary = "Predict station demand using AI")
    public ResponseEntity<ApiResponse<DemandPredictionResponse>> getDemandPrediction(
            @Valid @RequestBody DemandPredictionRequest request) {
        
        DemandPredictionResponse response = aiService.getDemand(request);
        return ResponseEntity.ok(ApiResponse.<DemandPredictionResponse>builder()
                .success(true)
                .message("Demand prediction retrieved successfully")
                .data(response)
                .build());
    }

    @PostMapping("/route")
    @Operation(summary = "Get optimized route using AI")
    public ResponseEntity<ApiResponse<RouteOptimizationResponse>> getOptimizedRoute(
            @Valid @RequestBody RouteOptimizationRequest request) {
        
        RouteOptimizationResponse response = aiService.getRoute(request);
        return ResponseEntity.ok(ApiResponse.<RouteOptimizationResponse>builder()
                .success(true)
                .message("Optimized route retrieved successfully")
                .data(response)
                .build());
    }
}
