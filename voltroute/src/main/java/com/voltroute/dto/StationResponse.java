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
public class StationResponse {
    private String id;
    private String name;
    private String operator;
    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private String country;
    private Double distance;
    private List<String> connectionTypes;
    private Boolean isFastChargeCapable;
}
