package com.voltroute.util;

import org.springframework.stereotype.Component;

/**
 * Utility class for JWT operations not covered by JwtService.
 * Can be used for static helper methods related to token formatting.
 */
@Component
public class JwtUtil {

    public static final String BEARER_PREFIX = "Bearer ";
    public static final String AUTH_HEADER = "Authorization";

    public String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
