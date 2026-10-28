package com.voltroute.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Authentication response payload containing JWT access token and user profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Authentication response payload")
public class AuthResponse {

    @Schema(description = "JWT bearer access token")
    private String token;

    @Builder.Default
    @Schema(description = "Token type", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Token validity period in milliseconds", example = "86400000")
    private long expiresIn;

    @Schema(description = "Authenticated user profile")
    private UserProfileDto user;
}
