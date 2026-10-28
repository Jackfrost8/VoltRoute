package com.voltroute.modules.route.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.voltroute.modules.station.dto.StationLocationDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Standardized response envelope containing route geometry, driving telemetry,
 * feasibility analysis, and ranked candidate charging stops.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePlanResponse {

    private StationLocationDto origin;
    private StationLocationDto destination;

    /**
     * Total road driving distance in kilometers.
     */
    private Double distanceKm;

    /**
     * Estimated driving duration in minutes.
     */
    private Double durationMinutes;

    /**
     * Route polyline geometry represented as ordered [latitude, longitude] coordinate pairs
     * ready for Leaflet and client mapping libraries.
     */
    private List<List<Double>> geometry;

    /**
     * High-level trip feasibility state.
     */
    private RouteFeasibility feasibility;

    /**
     * Explicit notice distinguishing estimates from guaranteed range telemetry.
     */
    private String feasibilityNotice;

    /**
     * Flag indicating whether battery charging is required during the trip.
     */
    @JsonProperty("isChargingRequired")
    private boolean isChargingRequired;

    /**
     * Estimated number of charging stops required to reach the destination safely.
     */
    private int estimatedStopsNeeded;

    /**
     * Estimated total energy required for the trip in kWh (if vehicle consumption was provided).
     */
    private Double estimatedEnergyConsumptionKwh;

    /**
     * Optimal charging stop(s) selected by the deterministic recommendation algorithm.
     */
    private List<CandidateStopDto> recommendedStops;

    /**
     * All discovered candidate charging stations within the detour corridor, sorted by composite rank.
     */
    private List<CandidateStopDto> allCandidateStops;
}
