package com.voltroute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandPredictionResponse {
    private String stationId;
    private String timeWindow;
    private Double predictedAvailabilityProbability;
    private Integer estimatedWaitTimeMinutes;
    private String demandLevel; // LOW, MEDIUM, HIGH
}
