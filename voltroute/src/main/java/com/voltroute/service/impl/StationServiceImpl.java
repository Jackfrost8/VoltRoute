package com.voltroute.service.impl;

import com.voltroute.client.OpenChargeMapClient;
import com.voltroute.dto.StationFilterRequest;
import com.voltroute.dto.StationResponse;
import com.voltroute.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StationServiceImpl implements StationService {

    private final OpenChargeMapClient openChargeMapClient;

    @Override
    public List<StationResponse> getNearbyStations(Double latitude, Double longitude, Double distanceKm) {
        return openChargeMapClient.getNearbyStations(latitude, longitude, distanceKm);
    }

    @Override
    public List<StationResponse> searchStations(StationFilterRequest filter) {
        return openChargeMapClient.searchStations(filter);
    }

    @Override
    public StationResponse getStationById(String stationId) {
        return openChargeMapClient.getStationById(stationId);
    }
}
