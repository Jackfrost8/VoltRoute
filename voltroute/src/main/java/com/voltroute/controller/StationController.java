package com.voltroute.controller;

import com.voltroute.dto.StationFilterRequest;
import com.voltroute.dto.StationResponse;
import com.voltroute.response.ApiResponse;
import com.voltroute.service.StationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Charging Stations", description = "Charging Station APIs")
public class StationController {

    private final StationService stationService;

    @GetMapping
    @Operation(summary = "Get nearby stations")
    public ResponseEntity<ApiResponse<List<StationResponse>>> getNearbyStations(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double distanceKm) {
        
        List<StationResponse> stations = stationService.getNearbyStations(latitude, longitude, distanceKm);
        return ResponseEntity.ok(ApiResponse.<List<StationResponse>>builder()
                .success(true)
                .message("Nearby stations retrieved successfully")
                .data(stations)
                .build());
    }

    @GetMapping("/{stationId}")
    @Operation(summary = "Get station details by ID")
    public ResponseEntity<ApiResponse<StationResponse>> getStationById(@PathVariable String stationId) {
        StationResponse station = stationService.getStationById(stationId);
        return ResponseEntity.ok(ApiResponse.<StationResponse>builder()
                .success(true)
                .message("Station details retrieved successfully")
                .data(station)
                .build());
    }

    @GetMapping("/search")
    @Operation(summary = "Search stations by city")
    public ResponseEntity<ApiResponse<List<StationResponse>>> searchStationsByCity(@RequestParam String city) {
        StationFilterRequest request = new StationFilterRequest();
        request.setCity(city);
        List<StationResponse> stations = stationService.searchStations(request);
        return ResponseEntity.ok(ApiResponse.<List<StationResponse>>builder()
                .success(true)
                .message("Stations retrieved successfully")
                .data(stations)
                .build());
    }

    @PostMapping("/filter")
    @Operation(summary = "Filter charging stations")
    public ResponseEntity<ApiResponse<List<StationResponse>>> filterStations(@RequestBody StationFilterRequest filterRequest) {
        List<StationResponse> stations = stationService.searchStations(filterRequest);
        return ResponseEntity.ok(ApiResponse.<List<StationResponse>>builder()
                .success(true)
                .message("Filtered stations retrieved successfully")
                .data(stations)
                .build());
    }
}
