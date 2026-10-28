package com.voltroute.modules.station.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter parameters for querying charging stations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Station search filter parameters")
public class StationSearchFilter {

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    @Schema(description = "Center latitude in decimal degrees (-90 to 90)", example = "37.7749")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    @Schema(description = "Center longitude in decimal degrees (-180 to 180)", example = "-122.4194")
    private Double longitude;

    @DecimalMin(value = "0.1", message = "Search radius must be greater than 0")
    @DecimalMax(value = "200.0", message = "Search radius cannot exceed 200 kilometers")
    @Builder.Default
    @Schema(description = "Search radius in kilometers (0.1 to 200.0, default 10.0)", example = "15.0")
    private Double radiusKm = 10.0;

    @Schema(description = "City or town name filter", example = "San Francisco")
    private String city;

    @Schema(description = "ISO 3166-1 alpha-2 two-letter country code", example = "US")
    private String countryCode;

    @Schema(description = "Filter by specific connector standard type ID", example = "33")
    private Integer connectionTypeId;

    @DecimalMin(value = "0.0", message = "Minimum power cannot be negative")
    @Schema(description = "Filter for stations with at least this charging power in kW", example = "50.0")
    private Double minPowerKw;

    @Min(value = 1, message = "maxResults must be at least 1")
    @Max(value = 100, message = "maxResults cannot exceed 100")
    @Builder.Default
    @Schema(description = "Maximum number of stations to return (1 to 100, default 50)", example = "50")
    private Integer maxResults = 50;
}
