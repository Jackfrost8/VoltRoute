package com.voltroute.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Open Charge Map external integration.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "voltroute.external.open-charge-map")
public class OpenChargeMapProperties {

    /**
     * Base URL of the Open Charge Map API v3.
     */
    private String baseUrl = "https://api.openchargemap.io/v3";

    /**
     * Secret API key for authenticating with Open Charge Map.
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
