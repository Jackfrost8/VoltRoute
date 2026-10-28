package com.voltroute;

import com.voltroute.modules.route.dto.CandidateStopDto;
import com.voltroute.modules.route.service.RouteRankingAlgorithm;
import com.voltroute.modules.station.dto.StationLocationDto;
import com.voltroute.modules.station.dto.StationSummaryDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class RouteRankingAlgorithmTest {

    private RouteRankingAlgorithm algorithm;

    @BeforeEach
    void setUp() {
        algorithm = new RouteRankingAlgorithm();
    }

    @Test
    @DisplayName("Haversine formula computes accurate geographic distance")
    void haversineKm_calculatesDistanceBetweenKnownCoordinates() {
        // San Francisco (37.7749, -122.4194) to Oakland (37.8044, -122.2712) ~ 13.5 km
        double distance = algorithm.haversineKm(37.7749, -122.4194, 37.8044, -122.2712);
        assertThat(distance).isCloseTo(13.5, within(1.5));
    }

    @Test
    @DisplayName("Candidate ranking scores ultra-fast station higher than slow AC station")
    void evaluateCandidate_ranksUltraFastLowDetourHigherThanSlowHighDetour() {
        StationSummaryDto fastStation = StationSummaryDto.builder()
                .id(1L)
                .title("Highway Supercharger")
                .maxPowerKw(250.0)
                .totalConnectors(8)
                .operationalStatus("Operational")
                .connectorTypes(List.of("CCS", "Tesla"))
                .build();

        StationSummaryDto slowStation = StationSummaryDto.builder()
                .id(2L)
                .title("Remote Town Wallbox")
                .maxPowerKw(11.0)
                .totalConnectors(1)
                .operationalStatus("Operational")
                .connectorTypes(List.of("Type 2"))
                .build();

        CandidateStopDto fastCandidate = algorithm.evaluateCandidate(
                fastStation, 1.0, 50.0, 15.0, "CCS", 350.0, 80.0
        );

        CandidateStopDto slowCandidate = algorithm.evaluateCandidate(
                slowStation, 12.0, 50.0, 15.0, "CCS", 350.0, 80.0
        );

        assertThat(fastCandidate.getCompositeScore()).isGreaterThan(slowCandidate.getCompositeScore());
        assertThat(fastCandidate.getRankingReason()).contains("Ultra-Fast DC");
        assertThat(fastCandidate.getRankingReason()).contains("CCS matched");
    }

    @Test
    @DisplayName("calculateRouteProjection accurately determines minimum detour and route progression")
    void calculateRouteProjection_computesDetourAndDistance() {
        List<List<Double>> geometry = List.of(
                List.of(37.7749, -122.4194), // SF
                List.of(37.8044, -122.2712), // Oakland
                List.of(37.8715, -122.2730)  // Berkeley
        );

        StationSummaryDto stationNearOakland = StationSummaryDto.builder()
                .id(10L)
                .location(StationLocationDto.builder()
                        .latitude(37.8050)
                        .longitude(-122.2710)
                        .build())
                .build();

        double[] projection = algorithm.calculateRouteProjection(stationNearOakland, geometry);
        double detour = projection[0];
        double distFromOrigin = projection[1];

        assertThat(detour).isLessThan(1.0); // directly adjacent to Oakland waypoint
        assertThat(distFromOrigin).isGreaterThan(10.0); // ~13.5 km from SF
    }
}
