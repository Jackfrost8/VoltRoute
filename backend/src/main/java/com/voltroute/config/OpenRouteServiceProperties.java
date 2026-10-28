package com.voltroute.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for OpenRouteService external integration.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "voltroute.external.open-route-service")
public class OpenRouteServiceProperties {

    /**
     * Base URL of the OpenRouteService API.
     */
    private String baseUrl = "https://api.openrouteservice.org";

    /**
     * Secret API key for authenticating with OpenRouteService.
     */
    private String apiKey;

    /**
     * HTTP connection timeout in milliseconds.
     */
    private int connectTimeoutMs = 5000;

    /**
     * HTTP read socket timeout in milliseconds.
     */
    private int readTimeoutMs = 10000;
}
