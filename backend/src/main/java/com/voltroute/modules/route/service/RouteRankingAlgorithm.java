package com.voltroute.modules.route.service;

import com.voltroute.modules.route.dto.CandidateStopDto;
import com.voltroute.modules.station.dto.StationSummaryDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic candidate-ranking algorithm for EV charging stop recommendations.
 *
 * Scoring model (0 - 100 points):
 * 1. Power Output (0 - 35 pts): Rewards DC Fast (50+ kW) and Ultra-Fast (150+ kW) stations.
 * 2. Detour Distance (0 - 30 pts): Strongly penalizes deviations off the main route line.
 * 3. Bay Capacity (0 - 15 pts): Rewards stations with many connectors to reduce queuing risk.
 * 4. Plug Compatibility (0 - 15 pts): Rewards exact match to driver's connector preference.
 * 5. Operational Status (0 - 5 pts): Rewards known operational stations.
 */
@Component
public class RouteRankingAlgorithm {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculates the great-circle distance between two geographic coordinates using Haversine formula.
     */
    public double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Calculates the minimum detour distance (in km) from a station to any point on the route polyline,
     * along with the cumulative distance along the route to that closest point.
     *
     * @return double[] { detourDistanceKm, distanceFromOriginKm }
     */
    public double[] calculateRouteProjection(StationSummaryDto station, List<List<Double>> routeGeometry) {
        if (station.getLocation() == null ||
                station.getLocation().getLatitude() == null ||
                station.getLocation().getLongitude() == null ||
                routeGeometry == null || routeGeometry.isEmpty()) {
            return new double[]{Double.MAX_VALUE, 0.0};
        }

        double sLat = station.getLocation().getLatitude();
        double sLon = station.getLocation().getLongitude();

        double minDetour = Double.MAX_VALUE;
        int closestIndex = 0;

        for (int i = 0; i < routeGeometry.size(); i++) {
            List<Double> pt = routeGeometry.get(i);
            // routeGeometry points are [latitude, longitude]
            double d = haversineKm(sLat, sLon, pt.get(0), pt.get(1));
            if (d < minDetour) {
                minDetour = d;
                closestIndex = i;
            }
        }

        // Calculate cumulative route distance from origin up to closestIndex
        double cumDist = 0.0;
        for (int i = 1; i <= closestIndex; i++) {
            List<Double> p1 = routeGeometry.get(i - 1);
            List<Double> p2 = routeGeometry.get(i);
            cumDist += haversineKm(p1.get(0), p1.get(1), p2.get(0), p2.get(1));
        }

        return new double[]{minDetour, cumDist};
    }

    /**
     * Evaluates a candidate station and computes its composite score and ranking explanation.
     */
    public CandidateStopDto evaluateCandidate(StationSummaryDto station,
                                             double detourKm,
                                             double distFromOriginKm,
                                             Double maxDetourKm,
                                             String preferredConnector,
                                             Double vehicleRangeKm,
                                             Double currentBatteryPercent) {

        double effectiveMaxDetour = (maxDetourKm != null && maxDetourKm > 0) ? maxDetourKm : 15.0;

        // 1. Power Score (0 to 35 pts)
        double powerKw = station.getMaxPowerKw() != null ? station.getMaxPowerKw() : 7.0;
        double powerScore = Math.min(35.0, (powerKw / 350.0) * 35.0);

        // 2. Detour Score (0 to 30 pts)
        double detourScore = Math.max(0.0, 30.0 * (1.0 - (detourKm / effectiveMaxDetour)));

        // 3. Bay Capacity Score (0 to 15 pts)
        int connectors = station.getTotalConnectors() != null ? station.getTotalConnectors() : 1;
        double baysScore = Math.min(15.0, connectors * 2.5);

        // 4. Compatibility Score (0 to 15 pts)
        double compatScore = 10.0; // default neutral
        boolean isExactCompat = false;
        if (preferredConnector != null && !preferredConnector.isBlank()) {
            if (station.getConnectorTypes() != null &&
                    station.getConnectorTypes().stream().anyMatch(t -> t.toLowerCase().contains(preferredConnector.toLowerCase()))) {
                compatScore = 15.0;
                isExactCompat = true;
            } else {
                compatScore = 0.0;
            }
        }

        // 5. Operational Status (0 to 5 pts)
        double statusScore = 3.0;
        if ("Operational".equalsIgnoreCase(station.getOperationalStatus())) {
            statusScore = 5.0;
        }

        double totalScore = Math.round((powerScore + detourScore + baysScore + compatScore + statusScore) * 10.0) / 10.0;

        // Estimated SoC at arrival
        Double estimatedSocAtArrival = null;
        if (vehicleRangeKm != null && vehicleRangeKm > 0 && currentBatteryPercent != null) {
            double rangeUsed = (distFromOriginKm / vehicleRangeKm) * 100.0;
            estimatedSocAtArrival = Math.max(0.0, Math.round((currentBatteryPercent - rangeUsed) * 10.0) / 10.0);
        }

        // Generate human-readable ranking reason
        List<String> reasons = new ArrayList<>();
        if (powerKw >= 150) {
            reasons.add(String.format("Ultra-Fast DC (%.0f kW)", powerKw));
        } else if (powerKw >= 50) {
            reasons.add(String.format("Fast DC (%.0f kW)", powerKw));
        } else {
            reasons.add(String.format("Standard AC (%.0f kW)", powerKw));
        }

        reasons.add(String.format("%.1f km detour", detourKm));

        if (connectors >= 6) {
            reasons.add(String.format("%d bays (low wait risk)", connectors));
        } else {
            reasons.add(String.format("%d bay(s)", connectors));
        }

        if (isExactCompat) {
            reasons.add(preferredConnector + " matched");
        }

        String reasonStr = String.join(" • ", reasons);

        return CandidateStopDto.builder()
                .station(station)
                .detourDistanceKm(Math.round(detourKm * 10.0) / 10.0)
                .distanceFromOriginKm(Math.round(distFromOriginKm * 10.0) / 10.0)
                .estimatedBatteryAtArrivalPercent(estimatedSocAtArrival)
                .compositeScore(totalScore)
                .rankingReason(reasonStr)
                .isRecommendedStop(false)
                .build();
    }
}
