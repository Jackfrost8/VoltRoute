package com.voltroute.modules.station.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Detailed representation of an EV charging station including all connectors,
 * operator metadata, contact points, and operational notes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Detailed EV charging station profile")
public class StationDetailDto {

    @Schema(description = "Open Charge Map station identifier", example = "163371")
    private Long id;

    @Schema(description = "Global unique identifier (UUID)", example = "599AEB21-A1F2-4EF6-8809-419C2D46D0AF")
    private String ocmUuid;

    @Schema(description = "Station or site title", example = "Pupatella Richmond Superchargers")
    private String title;

    @Schema(description = "Physical address and coordinates")
    private StationLocationDto location;

    @Schema(description = "Network operator name", example = "Tesla")
    private String operatorName;

    @Schema(description = "Network operator website URL", example = "https://www.tesla.com/supercharger")
    private String operatorWebsite;

    @Schema(description = "Primary contact telephone", example = "(804) 355-3135")
    private String contactTelephone;

    @Schema(description = "Primary contact email address")
    private String contactEmail;

    @Schema(description = "Driver access comments and physical location guidance", example = "Available for customers. Self park.")
    private String accessComments;

    @Schema(description = "General comments and equipment information", example = "2 Tesla Connectors, up to 12kW.")
    private String generalComments;

    @Schema(description = "General operational status", example = "Operational")
    private String operationalStatus;

    @Schema(description = "Indicates whether live slot occupancy data is available from provider", example = "false")
    private boolean realTimeOccupancyAvailable;

    @Schema(description = "ISO 8601 timestamp of last recorded status update in directory", example = "2020-08-22T05:51:00Z")
    private String dateLastStatusUpdate;

    @Schema(description = "List of all physical charging connectors available at this site")
    private List<ConnectorDto> connectors;
}
