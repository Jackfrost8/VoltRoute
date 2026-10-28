package com.voltroute.modules.health.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Data Transfer Object representing system health status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "System operational health status details")
public class HealthResponseDto {

    @Schema(description = "Overall service status", example = "UP")
    private String status;

    @Schema(description = "Application service name", example = "voltroute-backend")
    private String service;

    @Schema(description = "Application build version", example = "0.0.1-SNAPSHOT")
    private String version;

    @Schema(description = "Current server timestamp in UTC")
    private Instant timestamp;

    @Schema(description = "Active environment profile", example = "dev")
    private String environment;

    @Schema(description = "Subsystem health statuses")
    private Map<String, String> components;
}
