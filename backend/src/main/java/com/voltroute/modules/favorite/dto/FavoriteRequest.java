package com.voltroute.modules.favorite.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request payload for adding a charging station to user favorites.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload to bookmark an external EV station as favorite")
public class FavoriteRequest {

    @NotNull(message = "Station ID is required")
    @Schema(description = "External Open Charge Map station identifier", example = "163371")
    private Long stationId;

    @NotBlank(message = "Station title is required")
    @Schema(description = "Station title or location name", example = "Downtown Fast Charging Hub")
    private String stationTitle;

    @Schema(description = "Network operator name", example = "Tesla Supercharger")
    private String operatorName;

    @Schema(description = "Street address line", example = "100 Market St")
    private String addressLine;

    @Schema(description = "City or town", example = "San Francisco")
    private String city;

    @Schema(description = "State or province", example = "CA")
    private String stateOrProvince;

    @Schema(description = "Country code (ISO 3166-1 alpha-2)", example = "US")
    private String countryCode;

    @Schema(description = "Latitude in decimal degrees", example = "37.7749")
    private Double latitude;

    @Schema(description = "Longitude in decimal degrees", example = "-122.4194")
    private Double longitude;

    @Schema(description = "Maximum charging power in kW", example = "150.0")
    private Double maxPowerKw;

    @Schema(description = "Total number of bays / connectors", example = "8")
    private Integer totalConnectors;

    @Schema(description = "Available connector plug standards", example = "[\"CCS (Type 1)\", \"Tesla\"]")
    private List<String> connectorTypes;
}
