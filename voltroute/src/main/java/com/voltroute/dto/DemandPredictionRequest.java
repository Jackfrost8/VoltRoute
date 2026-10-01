package com.voltroute.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandPredictionRequest {
    @NotBlank(message = "Station ID is required")
    private String stationId;
    
    private String timeWindow; // e.g., "next_hour", "tomorrow"
}
