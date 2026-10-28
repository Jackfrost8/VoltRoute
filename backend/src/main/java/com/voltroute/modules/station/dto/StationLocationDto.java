package com.voltroute.modules.station.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standardized station geographic and address location details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Station geographic and physical address details")
public class StationLocationDto {

    @Schema(description = "Latitude in decimal degrees", example = "37.546347")
    private Double latitude;

    @Schema(description = "Longitude in decimal degrees", example = "-77.456361")
    private Double longitude;

    @Schema(description = "Street address line 1", example = "1 N Morris St")
    private String addressLine1;

    @Schema(description = "Street address line 2", example = "Suite 200")
    private String addressLine2;

    @Schema(description = "Town or City", example = "Richmond")
    private String city;

    @Schema(description = "State, province or region", example = "VA")
    private String stateOrProvince;

    @Schema(description = "Postal or ZIP code", example = "23220")
    private String postalCode;

    @Schema(description = "ISO two-letter country code", example = "US")
    private String countryCode;

    @Schema(description = "Full country name", example = "United States")
    private String countryName;

    @Schema(description = "Distance in kilometers from search center point", example = "3.45")
    private Double distanceKm;
}
