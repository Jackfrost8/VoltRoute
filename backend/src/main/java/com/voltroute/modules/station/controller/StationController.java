package com.voltroute.modules.station.controller;

import com.voltroute.common.response.ApiResponse;
import com.voltroute.modules.station.dto.StationDetailDto;
import com.voltroute.modules.station.dto.StationSearchFilter;
import com.voltroute.modules.station.dto.StationSummaryDto;
import com.voltroute.modules.station.service.StationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for EV charging station discovery, nearby geographic queries,
 * city search, and detailed station specifications.
 */
@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
@Tag(name = "Stations", description = "Endpoints for discovering EV charging stations and retrieving connector specifications")
public class StationController {

    private final StationService stationService;

    /**
     * Finds charging stations near a geographic location within a specified radius.
     */
    @GetMapping
    @Operation(
            summary = "Discover nearby charging stations",
            description = "Performs a geographic radius search around latitude/longitude coordinates using Open Charge Map."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Nearby stations retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid coordinate or radius parameters"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "502", description = "External Open Charge Map provider failure")
    })
    public ResponseEntity<ApiResponse<List<StationSummaryDto>>> getNearbyStations(
            @Valid @ModelAttribute StationSearchFilter filter) {
        List<StationSummaryDto> stations = stationService.getNearbyStations(filter);
        return ResponseEntity.ok(ApiResponse.ok("Retrieved " + stations.size() + " stations", stations));
    }

    /**
     * Searches for charging stations by city name and country code.
     */
    @GetMapping("/search")
    @Operation(
            summary = "Search charging stations by city/town",
            description = "Searches for charging stations located within a specific city or town."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Stations retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "City or country parameters missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "502", description = "External Open Charge Map provider failure")
    })
    public ResponseEntity<ApiResponse<List<StationSummaryDto>>> searchStations(
            @Valid @ModelAttribute StationSearchFilter filter) {
        List<StationSummaryDto> stations = stationService.searchStations(filter);
        return ResponseEntity.ok(ApiResponse.ok("Found " + stations.size() + " stations matching query", stations));
    }

    /**
     * Retrieves full station details by its Open Charge Map station ID.
     */
    @GetMapping("/{stationId}")
    @Operation(
            summary = "Get station details by ID",
            description = "Returns complete technical specification, connectors, operator contact, and location metadata for a specific station."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Station details retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid station ID format"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Station not found with the specified ID"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "502", description = "External Open Charge Map provider failure")
    })
    public ResponseEntity<ApiResponse<StationDetailDto>> getStationById(
            @Parameter(description = "Open Charge Map station ID", example = "163371")
            @PathVariable Long stationId) {
        StationDetailDto station = stationService.getStationById(stationId);
        return ResponseEntity.ok(ApiResponse.ok("Station details retrieved", station));
    }
}
