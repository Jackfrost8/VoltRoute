package com.voltroute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StationFilterRequest {
    private Double latitude;
    private Double longitude;
    private Double distanceKm = 10.0;
    private String city;
    private String operator;
    private String chargerType;
    private String connectorType;
    private Integer limit = 50;
}
