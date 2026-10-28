package com.voltroute.modules.station.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Lightweight summary representation of an EV charging station suitable for
 * map pins, search result cards, and listing views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Lightweight summary of an EV charging station")
public class StationSummaryDto {

    @Schema(description = "Open Charge Map station identifier", example = "163371")
    private Long id;

    @Schema(description = "Global unique identifier (UUID)", example = "599AEB21-A1F2-4EF6-8809-419C2D46D0AF")
    private String ocmUuid;

    @Schema(description = "Station or location title", example = "Downtown Fast Charging Hub")
    private String title;

    @Schema(description = "Geographic coordinates and basic address")
    private StationLocationDto location;

    @Schema(description = "Network operator name", example = "Tesla Supercharger")
    private String operatorName;

    @Schema(description = "General operational status", example = "Operational")
    private String operationalStatus;

    @Schema(description = "Indicates whether live slot occupancy data is available from provider", example = "false")
    private boolean realTimeOccupancyAvailable;

    @Schema(description = "Total number of physical charge points / bays", example = "8")
    private Integer totalConnectors;

    @Schema(description = "List of distinct connector standard names available", example = "[\"CCS (Type 2)\", \"Type 2 (Socket)\"]")
    private List<String> connectorTypes;

    @Schema(description = "Maximum charging power available across all connectors in kW", example = "150.0")
    private Double maxPowerKw;
}
