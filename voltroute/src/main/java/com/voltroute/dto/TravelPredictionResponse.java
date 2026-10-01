package com.voltroute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelPredictionResponse {
    private String origin;
    private String destination;
    private Integer estimatedDurationMinutes;
    private Double estimatedDistanceKm;
    private Double confidenceScore;
}
