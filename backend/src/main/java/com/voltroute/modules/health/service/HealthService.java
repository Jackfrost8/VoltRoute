package com.voltroute.modules.health.service;

import com.voltroute.modules.health.dto.HealthResponseDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Service responsible for computing application health and subsystem readiness.
 */
@Service
@RequiredArgsConstructor
public class HealthService {

    private static final Logger log = LoggerFactory.getLogger(HealthService.class);
    private final Environment environment;
    private final DataSource dataSource;

    public HealthResponseDto getHealthStatus() {
        Map<String, String> components = new HashMap<>();

        // Check Database status
        boolean dbHealthy = false;
        try (Connection connection = dataSource.getConnection()) {
            dbHealthy = connection.isValid(2);
            components.put("database", dbHealthy ? "UP" : "DOWN");
        } catch (Exception e) {
            log.warn("Database health probe check failed: {}", e.getMessage());
            components.put("database", "DOWN");
        }

        // Active profiles
        String[] activeProfiles = environment.getActiveProfiles();
        String currentEnv = activeProfiles.length > 0 ? String.join(",", activeProfiles) : "default";

        String overallStatus = dbHealthy ? "UP" : "DEGRADED";

        return HealthResponseDto.builder()
                .status(overallStatus)
                .service("voltroute-backend")
                .version("0.0.1-SNAPSHOT")
                .timestamp(Instant.now())
                .environment(currentEnv)
                .components(components)
                .build();
    }
}
