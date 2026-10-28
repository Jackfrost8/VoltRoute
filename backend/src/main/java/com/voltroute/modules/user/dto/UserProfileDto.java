package com.voltroute.modules.user.dto;

import com.voltroute.modules.user.domain.Role;
import com.voltroute.modules.user.domain.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Data transfer object representing a public/safe user profile.
 * Excludes sensitive fields such as password hashes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Safe user profile representation")
public class UserProfileDto {

    @Schema(description = "Unique user identifier", example = "1")
    private Long id;

    @Schema(description = "User email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "First name", example = "John")
    private String firstName;

    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "Assigned security roles", example = "[\"ROLE_USER\"]")
    private Set<String> roles;

    @Schema(description = "Timestamp when the account was registered")
    private LocalDateTime createdAt;

    public static UserProfileDto fromEntity(User user) {
        Set<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream()
                        .map(Role::getName)
                        .map(Enum::name)
                        .collect(Collectors.toSet())
                : Set.of();

        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
