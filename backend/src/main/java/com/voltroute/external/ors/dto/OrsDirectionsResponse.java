package com.voltroute.external.ors.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GeoJSON FeatureCollection response returned by OpenRouteService directions endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrsDirectionsResponse {
    private String type;
    private List<OrsFeature> features;
    private List<Double> bbox;
}
