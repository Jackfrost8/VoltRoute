package com.voltroute.modules.route.service;

import com.voltroute.common.exception.BadRequestException;
import com.voltroute.external.ors.OpenRouteServiceClient;
import com.voltroute.external.ors.dto.OrsDirectionsResponse;
import com.voltroute.external.ors.dto.OrsFeature;
import com.voltroute.modules.route.dto.CandidateStopDto;
import com.voltroute.modules.route.dto.RouteFeasibility;
import com.voltroute.modules.route.dto.RoutePlanRequest;
import com.voltroute.modules.route.dto.RoutePlanResponse;
import com.voltroute.modules.station.dto.StationLocationDto;
import com.voltroute.modules.station.dto.StationSearchFilter;
import com.voltroute.modules.station.dto.StationSummaryDto;
import com.voltroute.modules.station.service.StationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RouteServiceImpl implements RouteService {

    private final OpenRouteServiceClient routingClient;
    private final StationService stationService;
    private final RouteRankingAlgorithm rankingAlgorithm;

    private static final String FEASIBILITY_DISCLAIMER =
            "Deterministic range estimate. Real-world EV range varies with driving speed, ambient temperature, elevation, headwinds, payload, HVAC, and battery health.";

    @Override
    public RoutePlanResponse planRoute(RoutePlanRequest request) {
        validateCoordinates(request);

        log.info("Planning EV route from ({}, {}) to ({}, {}) [range={} km, battery={}%]",
                request.getOriginLatitude(), request.getOriginLongitude(),
                request.getDestinationLatitude(), request.getDestinationLongitude(),
                request.getVehicleRangeKm(), request.getCurrentBatteryPercent());

        // 1. Retrieve route from routing provider (OpenRouteService)
        OrsDirectionsResponse orsResponse = routingClient.getDrivingRoute(
                request.getOriginLatitude(), request.getOriginLongitude(),
                request.getDestinationLatitude(), request.getDestinationLongitude()
        );

        OrsFeature feature = orsResponse.getFeatures().get(0);
        double distanceMeters = 0.0;
        double durationSeconds = 0.0;
        if (feature.getProperties() != null && feature.getProperties().getSummary() != null) {
            distanceMeters = feature.getProperties().getSummary().getDistance() != null
                    ? feature.getProperties().getSummary().getDistance() : 0.0;
            durationSeconds = feature.getProperties().getSummary().getDuration() != null
                    ? feature.getProperties().getSummary().getDuration() : 0.0;
        }

        double totalDistanceKm = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
        double totalDurationMinutes = Math.round((durationSeconds / 60.0) * 10.0) / 10.0;

        // Convert GeoJSON [lon, lat] coordinates to Leaflet standard [lat, lon]
        List<List<Double>> routeGeometry = new ArrayList<>();
        if (feature.getGeometry() != null && feature.getGeometry().getCoordinates() != null) {
            for (List<Double> coord : feature.getGeometry().getCoordinates()) {
                if (coord != null && coord.size() >= 2) {
                    routeGeometry.add(List.of(coord.get(1), coord.get(0)));
                }
            }
        }

        // 2. Sample waypoints along the route to identify candidate charging stations
        List<StationSummaryDto> rawStations = sampleCandidateStations(routeGeometry, request);

        // 3. Project and rank candidate stations against the route corridor
        double maxDetour = (request.getMaxDetourKm() != null && request.getMaxDetourKm() > 0)
                ? request.getMaxDetourKm()
                : 15.0;

        List<CandidateStopDto> allCandidates = new ArrayList<>();
        for (StationSummaryDto station : rawStations) {
            double[] projection = rankingAlgorithm.calculateRouteProjection(station, routeGeometry);
            double detourKm = projection[0];
            double distFromOrigin = projection[1];

            if (detourKm <= maxDetour) {
                CandidateStopDto candidate = rankingAlgorithm.evaluateCandidate(
                        station,
                        detourKm,
                        distFromOrigin,
                        maxDetour,
                        request.getConnectorType(),
                        request.getVehicleRangeKm(),
                        request.getCurrentBatteryPercent()
                );
                allCandidates.add(candidate);
            }
        }

        // Sort candidates descending by composite score
        allCandidates.sort((a, b) -> Double.compare(b.getCompositeScore(), a.getCompositeScore()));

        // 4. Feasibility analysis and recommended charging stops selection
        RouteFeasibility feasibility;
        boolean isChargingRequired = false;
        int estimatedStopsNeeded = 0;
        List<CandidateStopDto> recommendedStops = new ArrayList<>();

        Double usableRangeKm = null;
        if (request.getVehicleRangeKm() != null && request.getVehicleRangeKm() > 0) {
            double soc = (request.getCurrentBatteryPercent() != null) ? request.getCurrentBatteryPercent() : 100.0;
            usableRangeKm = request.getVehicleRangeKm() * (soc / 100.0);
        }

        // Calculate estimated energy consumption in kWh
        Double estimatedEnergyKwh = null;
        if (request.getConsumptionKwhPer100Km() != null && request.getConsumptionKwhPer100Km() > 0) {
            estimatedEnergyKwh = Math.round(((totalDistanceKm / 100.0) * request.getConsumptionKwhPer100Km()) * 10.0) / 10.0;
        } else if (usableRangeKm != null && request.getBatteryCapacityKwh() != null) {
            double rate = (request.getBatteryCapacityKwh() / request.getVehicleRangeKm()) * 100.0;
            estimatedEnergyKwh = Math.round(((totalDistanceKm / 100.0) * rate) * 10.0) / 10.0;
        }

        if (usableRangeKm == null) {
            feasibility = RouteFeasibility.ESTIMATE_ONLY_NO_VEHICLE_DATA;
            // Provide top candidate as convenience option if available
            if (!allCandidates.isEmpty()) {
                CandidateStopDto top = allCandidates.get(0);
                top.setRecommendedStop(true);
                recommendedStops.add(top);
            }
        } else if (totalDistanceKm <= usableRangeKm * 0.85) {
            feasibility = RouteFeasibility.FEASIBLE_DIRECT;
            isChargingRequired = false;
            estimatedStopsNeeded = 0;
        } else {
            isChargingRequired = true;
            double remainingDistance = totalDistanceKm - usableRangeKm;
            estimatedStopsNeeded = Math.max(1, (int) Math.ceil(remainingDistance / (request.getVehicleRangeKm() * 0.70)));

            // Select optimal stop within reachable battery window (between 30% and 85% of usable range)
            double minStopDist = usableRangeKm * 0.30;
            double maxStopDist = usableRangeKm * 0.85;

            CandidateStopDto primaryStop = allCandidates.stream()
                    .filter(c -> c.getDistanceFromOriginKm() >= minStopDist && c.getDistanceFromOriginKm() <= maxStopDist)
                    .findFirst()
                    .orElse(null);

            // Fallback: any candidate before battery exhaustion
            if (primaryStop == null) {
                primaryStop = allCandidates.stream()
                        .filter(c -> c.getDistanceFromOriginKm() <= maxStopDist)
                        .findFirst()
                        .orElse(null);
            }

            if (primaryStop != null) {
                primaryStop.setRecommendedStop(true);
                recommendedStops.add(primaryStop);
                feasibility = RouteFeasibility.FEASIBLE_WITH_STOPS;
            } else if (allCandidates.isEmpty()) {
                feasibility = RouteFeasibility.RANGE_CONSTRAINED_NO_STOPS_FOUND;
            } else {
                // Candidates exist but are past initial battery exhaustion window
                feasibility = RouteFeasibility.RANGE_CONSTRAINED_NO_STOPS_FOUND;
            }
        }

        StationLocationDto originLocation = StationLocationDto.builder()
                .latitude(request.getOriginLatitude())
                .longitude(request.getOriginLongitude())
                .addressLine1(request.getOriginName() != null ? request.getOriginName() : "Origin")
                .build();

        StationLocationDto destinationLocation = StationLocationDto.builder()
                .latitude(request.getDestinationLatitude())
                .longitude(request.getDestinationLongitude())
                .addressLine1(request.getDestinationName() != null ? request.getDestinationName() : "Destination")
                .build();

        return RoutePlanResponse.builder()
                .origin(originLocation)
                .destination(destinationLocation)
                .distanceKm(totalDistanceKm)
                .durationMinutes(totalDurationMinutes)
                .geometry(routeGeometry)
                .feasibility(feasibility)
                .feasibilityNotice(FEASIBILITY_DISCLAIMER)
                .isChargingRequired(isChargingRequired)
                .estimatedStopsNeeded(estimatedStopsNeeded)
                .estimatedEnergyConsumptionKwh(estimatedEnergyKwh)
                .recommendedStops(recommendedStops)
                .allCandidateStops(allCandidates)
                .build();
    }

    private void validateCoordinates(RoutePlanRequest request) {
        if (request.getOriginLatitude() == null || request.getOriginLongitude() == null ||
                request.getDestinationLatitude() == null || request.getDestinationLongitude() == null) {
            throw new BadRequestException("Origin and destination coordinates are required.");
        }
        if (request.getOriginLatitude() < -90.0 || request.getOriginLatitude() > 90.0 ||
                request.getDestinationLatitude() < -90.0 || request.getDestinationLatitude() > 90.0) {
            throw new BadRequestException("Latitude coordinates must be between -90 and 90.");
        }
        if (request.getOriginLongitude() < -180.0 || request.getOriginLongitude() > 180.0 ||
                request.getDestinationLongitude() < -180.0 || request.getDestinationLongitude() > 180.0) {
            throw new BadRequestException("Longitude coordinates must be between -180 and 180.");
        }

        double dLat = Math.abs(request.getOriginLatitude() - request.getDestinationLatitude());
        double dLon = Math.abs(request.getOriginLongitude() - request.getDestinationLongitude());
        if (dLat < 0.0001 && dLon < 0.0001) {
            throw new BadRequestException("Origin and destination coordinates cannot be identical.");
        }
    }

    private List<StationSummaryDto> sampleCandidateStations(List<List<Double>> geometry, RoutePlanRequest request) {
        if (geometry == null || geometry.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> seenIds = new HashSet<>();
        List<StationSummaryDto> collectedStations = new ArrayList<>();

        // Sample checkpoints along the polyline (every ~35 km or 5-10 checkpoints across route)
        int step = Math.max(1, geometry.size() / 8);
        List<List<Double>> samplePoints = new ArrayList<>();
        samplePoints.add(geometry.get(0));

        for (int i = step; i < geometry.size() - 1; i += step) {
            samplePoints.add(geometry.get(i));
        }
        samplePoints.add(geometry.get(geometry.size() - 1));

        double searchRadius = (request.getMaxDetourKm() != null && request.getMaxDetourKm() > 0)
                ? Math.min(request.getMaxDetourKm() * 1.5, 30.0)
                : 20.0;

        for (List<Double> pt : samplePoints) {
            try {
                StationSearchFilter filter = StationSearchFilter.builder()
                        .latitude(pt.get(0))
                        .longitude(pt.get(1))
                        .radiusKm(searchRadius)
                        .maxResults(25)
                        .minPowerKw(request.getMinPowerKw())
                        .build();

                List<StationSummaryDto> nearby = stationService.getNearbyStations(filter);
                for (StationSummaryDto st : nearby) {
                    if (seenIds.add(st.getId())) {
                        collectedStations.add(st);
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed sampling stations near ({}, {}): {}", pt.get(0), pt.get(1), ex.getMessage());
            }
        }

        return collectedStations;
    }
}
