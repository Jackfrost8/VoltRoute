package com.voltroute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptimizationResponse {
    private String origin;
    private String destination;
    private Double totalDistanceKm;
    private Integer totalDurationMinutes;
    private List<StationResponse> recommendedStops;
}
