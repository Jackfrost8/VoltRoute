package com.voltroute.modules.route.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for planning an EV route and finding recommended charging stops.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePlanRequest {

    @NotNull(message = "Origin latitude is required")
    @DecimalMin(value = "-90.0", message = "Origin latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Origin latitude must be between -90 and 90")
    private Double originLatitude;

    @NotNull(message = "Origin longitude is required")
    @DecimalMin(value = "-180.0", message = "Origin longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Origin longitude must be between -180 and 180")
    private Double originLongitude;

    private String originName;

    @NotNull(message = "Destination latitude is required")
    @DecimalMin(value = "-90.0", message = "Destination latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Destination latitude must be between -90 and 90")
    private Double destinationLatitude;

    @NotNull(message = "Destination longitude is required")
    @DecimalMin(value = "-180.0", message = "Destination longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Destination longitude must be between -180 and 180")
    private Double destinationLongitude;

    private String destinationName;

    /**
     * Estimated maximum vehicle range on a full 100% battery charge (in kilometers).
     */
    @Positive(message = "Vehicle range must be positive")
    private Double vehicleRangeKm;

    /**
     * Current battery state of charge (SoC) in percent (1.0 to 100.0).
     */
    @DecimalMin(value = "1.0", message = "Current battery percent must be between 1 and 100")
    @DecimalMax(value = "100.0", message = "Current battery percent must be between 1 and 100")
    private Double currentBatteryPercent;

    /**
     * Total battery pack usable capacity in kWh (e.g. 75.0).
     */
    @Positive(message = "Battery capacity must be positive")
    private Double batteryCapacityKwh;

    /**
     * Vehicle average energy consumption rate in kWh per 100 km (e.g. 18.5).
     */
    @Positive(message = "Energy consumption must be positive")
    private Double consumptionKwhPer100Km;

    /**
     * Preferred minimum charging power output in kW (e.g. 50.0 for DC Fast).
     */
    private Double minPowerKw;

    /**
     * Preferred connector standard (e.g. "CCS", "Type 2", "CHAdeMO", "Tesla").
     */
    private String connectorType;

    /**
     * Maximum acceptable detour distance from route corridor (in kilometers).
     */
    @Builder.Default
    private Double maxDetourKm = 15.0;
}
