package com.voltroute.modules.station.service;

import com.voltroute.common.exception.BadRequestException;
import com.voltroute.common.exception.ResourceNotFoundException;
import com.voltroute.external.ocm.OpenChargeMapClient;
import com.voltroute.external.ocm.dto.*;
import com.voltroute.modules.station.dto.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing EV charging station discovery, search, filtering, and detail lookups.
 * Mediates between API controllers and the external Open Charge Map provider.
 */
@Service
@RequiredArgsConstructor
public class StationService {

    private static final Logger log = LoggerFactory.getLogger(StationService.class);

    private final OpenChargeMapClient openChargeMapClient;

    /**
     * Finds charging stations near a geographic coordinate point within a specified radius.
     */
    public List<StationSummaryDto> getNearbyStations(StationSearchFilter filter) {
        validateCoordinates(filter.getLatitude(), filter.getLongitude());
        validateRadius(filter.getRadiusKm());

        int maxResults = (filter.getMaxResults() != null) ? filter.getMaxResults() : 50;

        List<OcmPoiResponse> rawStations = openChargeMapClient.getNearbyStations(
                filter.getLatitude(),
                filter.getLongitude(),
                filter.getRadiusKm(),
                maxResults,
                filter.getConnectionTypeId(),
                filter.getMinPowerKw()
        );

        return rawStations.stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Searches for charging stations by city/town or text query.
     */
    public List<StationSummaryDto> searchStations(StationSearchFilter filter) {
        if (!StringUtils.hasText(filter.getCity())) {
            throw new BadRequestException("City parameter is required for city search");
        }

        String searchCity = filter.getCity().trim();

        // If coordinates are also provided, use radius query and filter by city
        if (filter.getLatitude() != null && filter.getLongitude() != null) {
            validateCoordinates(filter.getLatitude(), filter.getLongitude());
            List<StationSummaryDto> nearby = getNearbyStations(filter);
            return nearby.stream()
                    .filter(s -> s.getLocation() != null && s.getLocation().getCity() != null
                            && s.getLocation().getCity().toLowerCase().contains(searchCity.toLowerCase()))
                    .collect(Collectors.toList());
        }

        // Without coordinates, country code is required to bound provider queries
        if (!StringUtils.hasText(filter.getCountryCode())) {
            throw new BadRequestException("Country code (e.g. 'US', 'DE', 'IN', 'GB') is required when searching by city without coordinates");
        }

        String countryCode = filter.getCountryCode().trim().toUpperCase();
        int maxResults = (filter.getMaxResults() != null) ? Math.min(filter.getMaxResults() * 2, 100) : 100;

        List<OcmPoiResponse> rawStations = openChargeMapClient.getStationsByCountry(
                countryCode,
                maxResults,
                filter.getConnectionTypeId(),
                filter.getMinPowerKw()
        );

        return rawStations.stream()
                .filter(poi -> poi.getAddressInfo() != null
                        && poi.getAddressInfo().getTown() != null
                        && poi.getAddressInfo().getTown().toLowerCase().contains(searchCity.toLowerCase()))
                .limit(filter.getMaxResults() != null ? filter.getMaxResults() : 50)
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Looks up comprehensive station details for a specific Open Charge Map station ID.
     */
    public StationDetailDto getStationById(Long stationId) {
        if (stationId == null || stationId <= 0) {
            throw new BadRequestException("Invalid station ID: " + stationId);
        }

        OcmPoiResponse poi = openChargeMapClient.getStationById(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Station", "id", stationId));

        return mapToDetailDto(poi);
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new BadRequestException("Coordinates (latitude and longitude) are required");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90 degrees");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180 degrees");
        }
    }

    private void validateRadius(Double radiusKm) {
        if (radiusKm != null && (radiusKm < 0.1 || radiusKm > 200.0)) {
            throw new BadRequestException("Search radius must be between 0.1 and 200.0 kilometers");
        }
    }

    private StationSummaryDto mapToSummaryDto(OcmPoiResponse poi) {
        StationLocationDto location = mapLocation(poi.getAddressInfo());

        String operatorName = poi.getOperatorInfo() != null ? poi.getOperatorInfo().getTitle() : null;
        String operationalStatus = poi.getStatusType() != null ? poi.getStatusType().getTitle() : "Operational";

        List<String> connectorTypes = Collections.emptyList();
        double maxPowerKw = 0.0;
        int totalConnectors = 0;

        if (poi.getConnections() != null) {
            connectorTypes = poi.getConnections().stream()
                    .map(OcmConnection::getConnectionType)
                    .filter(Objects::nonNull)
                    .map(OcmConnectionType::getTitle)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .collect(Collectors.toList());

            maxPowerKw = poi.getConnections().stream()
                    .map(OcmConnection::getPowerKw)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .max()
                    .orElse(0.0);

            totalConnectors = poi.getConnections().stream()
                    .mapToInt(c -> c.getQuantity() != null ? c.getQuantity() : 1)
                    .sum();
        }

        if (poi.getNumberOfPoints() != null && poi.getNumberOfPoints() > 0) {
            totalConnectors = Math.max(totalConnectors, poi.getNumberOfPoints());
        }

        String title = (poi.getAddressInfo() != null && StringUtils.hasText(poi.getAddressInfo().getTitle()))
                ? poi.getAddressInfo().getTitle()
                : (operatorName != null ? operatorName + " Charging Station" : "EV Charging Station");

        return StationSummaryDto.builder()
                .id(poi.getId())
                .ocmUuid(poi.getUuid())
                .title(title)
                .location(location)
                .operatorName(operatorName)
                .operationalStatus(operationalStatus)
                .realTimeOccupancyAvailable(false) // OCM static directory does not provide live slot telemetry
                .totalConnectors(totalConnectors)
                .connectorTypes(connectorTypes)
                .maxPowerKw(maxPowerKw)
                .build();
    }

    private StationDetailDto mapToDetailDto(OcmPoiResponse poi) {
        StationLocationDto location = mapLocation(poi.getAddressInfo());

        String operatorName = poi.getOperatorInfo() != null ? poi.getOperatorInfo().getTitle() : null;
        String operatorWebsite = poi.getOperatorInfo() != null ? poi.getOperatorInfo().getWebsiteUrl() : null;
        String operationalStatus = poi.getStatusType() != null ? poi.getStatusType().getTitle() : "Operational";

        String contactPhone = poi.getAddressInfo() != null ? poi.getAddressInfo().getContactTelephone1() : null;
        String contactEmail = poi.getAddressInfo() != null ? poi.getAddressInfo().getContactEmail() : null;
        String accessComments = poi.getAddressInfo() != null ? poi.getAddressInfo().getAccessComments() : null;

        List<ConnectorDto> connectors = Collections.emptyList();
        if (poi.getConnections() != null) {
            connectors = poi.getConnections().stream()
                    .map(this::mapConnector)
                    .collect(Collectors.toList());
        }

        String title = (poi.getAddressInfo() != null && StringUtils.hasText(poi.getAddressInfo().getTitle()))
                ? poi.getAddressInfo().getTitle()
                : (operatorName != null ? operatorName + " Charging Station" : "EV Charging Station");

        return StationDetailDto.builder()
                .id(poi.getId())
                .ocmUuid(poi.getUuid())
                .title(title)
                .location(location)
                .operatorName(operatorName)
                .operatorWebsite(operatorWebsite)
                .contactTelephone(contactPhone)
                .contactEmail(contactEmail)
                .accessComments(accessComments)
                .generalComments(poi.getGeneralComments())
                .operationalStatus(operationalStatus)
                .realTimeOccupancyAvailable(false) // OCM static directory does not provide live slot telemetry
                .dateLastStatusUpdate(poi.getDateLastStatusUpdate())
                .connectors(connectors)
                .build();
    }

    private StationLocationDto mapLocation(OcmAddressInfo addr) {
        if (addr == null) {
            return null;
        }

        String countryCode = addr.getCountry() != null ? addr.getCountry().getIsoCode() : null;
        String countryName = addr.getCountry() != null ? addr.getCountry().getTitle() : null;

        return StationLocationDto.builder()
                .latitude(addr.getLatitude())
                .longitude(addr.getLongitude())
                .addressLine1(addr.getAddressLine1())
                .addressLine2(addr.getAddressLine2())
                .city(addr.getTown())
                .stateOrProvince(addr.getStateOrProvince())
                .postalCode(addr.getPostcode())
                .countryCode(countryCode)
                .countryName(countryName)
                .distanceKm(addr.getDistance())
                .build();
    }

    private ConnectorDto mapConnector(OcmConnection conn) {
        String typeName = conn.getConnectionType() != null ? conn.getConnectionType().getTitle() : "Standard";
        String formalName = conn.getConnectionType() != null ? conn.getConnectionType().getFormalName() : null;
        String currentType = conn.getCurrentType() != null ? conn.getCurrentType().getTitle() : null;
        String status = conn.getStatusType() != null ? conn.getStatusType().getTitle() : "Operational";

        boolean fastCharge = (conn.getLevel() != null && Boolean.TRUE.equals(conn.getLevel().getIsFastChargeCapable()))
                || (conn.getPowerKw() != null && conn.getPowerKw() >= 40.0);

        return ConnectorDto.builder()
                .id(conn.getId())
                .connectionTypeId(conn.getConnectionTypeId())
                .connectionTypeName(typeName)
                .formalName(formalName)
                .powerKw(conn.getPowerKw())
                .voltage(conn.getVoltage())
                .amps(conn.getAmps())
                .currentType(currentType)
                .quantity(conn.getQuantity() != null ? conn.getQuantity() : 1)
                .status(status)
                .isFastChargeCapable(fastCharge)
                .build();
    }
}
