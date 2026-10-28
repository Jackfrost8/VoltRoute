package com.voltroute.modules.route.controller;

import com.voltroute.common.response.ApiResponse;
import com.voltroute.modules.route.dto.RoutePlanRequest;
import com.voltroute.modules.route.dto.RoutePlanResponse;
import com.voltroute.modules.route.service.RouteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing REST endpoints for EV route planning, polyline geometry,
 * and ranked charging-stop recommendations.
 */
@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Route Planning & Recommendations", description = "Endpoints for EV route planning, polyline rendering, and candidate charging stop recommendations")
public class RouteController {

    private final RouteService routeService;

    @PostMapping("/plan")
    @Operation(
            summary = "Plan EV route and recommend charging stops",
            description = "Calculates driving route geometry and distance via OpenRouteService, samples charging stations along the route corridor, applies deterministic ranking, and estimates battery feasibility."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Route planned and charging stops recommended successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid coordinate inputs or identical origin/destination",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "502",
                    description = "External routing provider unavailable or unroutable",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            )
    })
    public ResponseEntity<ApiResponse<RoutePlanResponse>> planRoute(@Valid @RequestBody RoutePlanRequest request) {
        log.info("Received route planning request from ({}, {}) to ({}, {})",
                request.getOriginLatitude(), request.getOriginLongitude(),
                request.getDestinationLatitude(), request.getDestinationLongitude());

        RoutePlanResponse response = routeService.planRoute(request);

        return ResponseEntity.ok(ApiResponse.ok("EV route planned successfully", response));
    }
}
