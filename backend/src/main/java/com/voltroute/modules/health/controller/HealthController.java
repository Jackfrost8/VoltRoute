package com.voltroute.modules.health.controller;

import com.voltroute.common.response.ApiResponse;
import com.voltroute.modules.health.dto.HealthResponseDto;
import com.voltroute.modules.health.service.HealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health Controller for platform availability and probe verification.
 */
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Tag(name = "Health", description = "System health, readiness, and liveness endpoints")
public class HealthController {

    private final HealthService healthService;

    @GetMapping
    @Operation(summary = "Liveness and Readiness Probe", description = "Checks the operational status of the service, active profile, and database connectivity.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Service is operational and running",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            )
    })
    public ResponseEntity<ApiResponse<HealthResponseDto>> checkHealth() {
        HealthResponseDto health = healthService.getHealthStatus();
        return ResponseEntity.ok(ApiResponse.ok("Service operational", health));
    }
}
