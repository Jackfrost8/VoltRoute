package com.voltroute.modules.favorite.dto;

import com.voltroute.modules.favorite.domain.Favorite;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Data transfer object representing a bookmarked charging station favorite.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Representation of a bookmarked charging station favorite")
public class FavoriteDto {

    @Schema(description = "Internal unique favorite record ID", example = "1")
    private Long id;

    @Schema(description = "External Open Charge Map station ID", example = "163371")
    private Long stationId;

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

    @Schema(description = "Timestamp when station was added to favorites")
    private LocalDateTime createdAt;

    public static FavoriteDto fromEntity(Favorite favorite) {
        List<String> types = favorite.getConnectorTypes() != null && !favorite.getConnectorTypes().isBlank()
                ? Arrays.asList(favorite.getConnectorTypes().split(",\\s*"))
                : Collections.emptyList();

        return FavoriteDto.builder()
                .id(favorite.getId())
                .stationId(favorite.getStationId())
                .stationTitle(favorite.getStationTitle())
                .operatorName(favorite.getOperatorName())
                .addressLine(favorite.getAddressLine())
                .city(favorite.getCity())
                .stateOrProvince(favorite.getStateOrProvince())
                .countryCode(favorite.getCountryCode())
                .latitude(favorite.getLatitude())
                .longitude(favorite.getLongitude())
                .maxPowerKw(favorite.getMaxPowerKw())
                .totalConnectors(favorite.getTotalConnectors())
                .connectorTypes(types)
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
