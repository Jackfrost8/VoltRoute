package com.voltroute.service;

import com.voltroute.dto.StationFilterRequest;
import com.voltroute.dto.StationResponse;

import java.util.List;

public interface StationService {
    List<StationResponse> getNearbyStations(Double latitude, Double longitude, Double distanceKm);
    List<StationResponse> searchStations(StationFilterRequest filter);
    StationResponse getStationById(String stationId);
}
