package com.voltroute.modules.route.dto;

import com.voltroute.modules.station.dto.StationSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representation of a charging stop candidate positioned near the driving route.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateStopDto {

    /**
     * Charging station summary details.
     */
    private StationSummaryDto station;

    /**
     * Approximate driving detour distance off the main route line (in kilometers).
     */
    private Double detourDistanceKm;

    /**
     * Cumulative distance from origin along the route corridor (in kilometers).
     */
    private Double distanceFromOriginKm;

    /**
     * Estimated battery state of charge (SoC %) upon arrival at this stop.
     */
    private Double estimatedBatteryAtArrivalPercent;

    /**
     * Deterministic composite score (0.0 to 100.0) based on power, detour, bays, and compatibility.
     */
    private Double compositeScore;

    /**
     * Documented explanation of how this station was ranked.
     */
    private String rankingReason;

    /**
     * Whether this candidate stop is selected as an active recommended charging stop.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("isRecommendedStop")
    private boolean isRecommendedStop;
}
