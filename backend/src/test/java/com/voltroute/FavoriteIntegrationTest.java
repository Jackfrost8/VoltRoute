package com.voltroute;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltroute.modules.favorite.domain.Favorite;
import com.voltroute.modules.favorite.dto.FavoriteRequest;
import com.voltroute.modules.favorite.repository.FavoriteRepository;
import com.voltroute.modules.user.domain.Role;
import com.voltroute.modules.user.domain.RoleName;
import com.voltroute.modules.user.domain.User;
import com.voltroute.modules.user.repository.RoleRepository;
import com.voltroute.modules.user.repository.UserRepository;
import com.voltroute.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FavoriteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testUser1;
    private User testUser2;
    private String tokenUser1;
    private String tokenUser2;

    @BeforeEach
    void setUp() {
        favoriteRepository.deleteAll();
        userRepository.deleteAll();

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build()));

        testUser1 = userRepository.save(User.builder()
                .email("driver1@voltroute.com")
                .firstName("Driver")
                .lastName("One")
                .password(passwordEncoder.encode("Password123!"))
                .roles(Set.of(userRole))
                .build());

        testUser2 = userRepository.save(User.builder()
                .email("driver2@voltroute.com")
                .firstName("Driver")
                .lastName("Two")
                .password(passwordEncoder.encode("Password123!"))
                .roles(Set.of(userRole))
                .build());

        tokenUser1 = jwtTokenProvider.generateToken(
                testUser1.getId(),
                testUser1.getEmail(),
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        tokenUser2 = jwtTokenProvider.generateToken(
                testUser2.getId(),
                testUser2.getEmail(),
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Test
    @DisplayName("POST /api/favorites: Add favorite successfully")
    void addFavorite_shouldSucceedForAuthenticatedUser() throws Exception {
        FavoriteRequest request = FavoriteRequest.builder()
                .stationId(163371L)
                .stationTitle("Market Street Fast Hub")
                .operatorName("Tesla Supercharger")
                .addressLine("100 Market St")
                .city("San Francisco")
                .countryCode("US")
                .latitude(37.7937)
                .longitude(-122.3965)
                .maxPowerKw(250.0)
                .totalConnectors(12)
                .connectorTypes(List.of("Tesla", "CCS"))
                .build();

        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.status", is(201)))
                .andExpect(jsonPath("$.data.stationId", is(163371)))
                .andExpect(jsonPath("$.data.stationTitle", is("Market Street Fast Hub")))
                .andExpect(jsonPath("$.data.operatorName", is("Tesla Supercharger")))
                .andExpect(jsonPath("$.data.maxPowerKw", is(250.0)));

        assertThat(favoriteRepository.existsByUserIdAndStationId(testUser1.getId(), 163371L)).isTrue();
    }

    @Test
    @DisplayName("POST /api/favorites: Prevent duplicate favorite for the same user (409 Conflict)")
    void addFavorite_duplicateShouldReturn409Conflict() throws Exception {
        FavoriteRequest request = FavoriteRequest.builder()
                .stationId(163371L)
                .stationTitle("Market Street Fast Hub")
                .build();

        // First add succeeds
        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate add returns 409 Conflict
        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("already in your favorites")));
    }

    @Test
    @DisplayName("GET /api/favorites: Retrieve favorites for authenticated user")
    void getFavorites_shouldReturnUserFavorites() throws Exception {
        favoriteRepository.save(Favorite.builder()
                .user(testUser1)
                .stationId(101L)
                .stationTitle("Station 101")
                .city("San Francisco")
                .maxPowerKw(150.0)
                .build());

        favoriteRepository.save(Favorite.builder()
                .user(testUser1)
                .stationId(102L)
                .stationTitle("Station 102")
                .city("Oakland")
                .maxPowerKw(50.0)
                .build());

        mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[?(@.stationId == 101)].stationTitle", contains("Station 101")))
                .andExpect(jsonPath("$.data[?(@.stationId == 102)].stationTitle", contains("Station 102")));
    }

    @Test
    @DisplayName("DELETE /api/favorites/{stationId}: Remove favorite successfully")
    void removeFavorite_shouldDeleteFavorite() throws Exception {
        favoriteRepository.save(Favorite.builder()
                .user(testUser1)
                .stationId(201L)
                .stationTitle("Station to Remove")
                .build());

        mockMvc.perform(delete("/api/favorites/201")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Favorite removed successfully")));

        assertThat(favoriteRepository.existsByUserIdAndStationId(testUser1.getId(), 201L)).isFalse();
    }

    @Test
    @DisplayName("DELETE /api/favorites/{stationId}: Missing favorite returns 404 Not Found")
    void removeFavorite_nonExistentShouldReturn404() throws Exception {
        mockMvc.perform(delete("/api/favorites/999999")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsString("Favorite not found")));
    }

    @Test
    @DisplayName("Cross-User Isolation: User cannot see or delete another user's favorite")
    void crossUserIsolation_userCannotAccessOtherUsersFavorites() throws Exception {
        // User 1 saves station 301
        favoriteRepository.save(Favorite.builder()
                .user(testUser1)
                .stationId(301L)
                .stationTitle("User 1 Secret Station")
                .build());

        // User 2 queries favorites -> should be empty
        mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        // User 2 attempts to delete User 1's favorite -> 404 Not Found
        mockMvc.perform(delete("/api/favorites/301")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound());

        // Verify User 1's favorite remains intact in database
        assertThat(favoriteRepository.existsByUserIdAndStationId(testUser1.getId(), 301L)).isTrue();
    }

    @Test
    @DisplayName("Unauthorized Access: Missing or invalid JWT returns 401 Unauthorized")
    void unauthorizedAccess_shouldRejectUnauthenticatedRequests() throws Exception {
        // Missing token
        mockMvc.perform(get("/api/favorites"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/favorites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stationId\": 101, \"stationTitle\": \"Unauthorized\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/favorites/101"))
                .andExpect(status().isUnauthorized());

        // Malformed / invalid token
        mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer invalid.malformed.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/favorites: Missing required fields returns 400 Bad Request")
    void addFavorite_missingRequiredFieldsShouldReturn400() throws Exception {
        // Missing stationId
        FavoriteRequest missingIdRequest = FavoriteRequest.builder()
                .stationTitle("No Station ID")
                .build();

        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingIdRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.stationId", notNullValue()));

        // Blank stationTitle
        FavoriteRequest blankTitleRequest = FavoriteRequest.builder()
                .stationId(999L)
                .stationTitle("   ")
                .build();

        mockMvc.perform(post("/api/favorites")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankTitleRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.stationTitle", notNullValue()));
    }

    @Test
    @DisplayName("Database Constraint Behavior: Direct entity persistence duplicate throws exception")
    void databaseConstraint_enforcesUniqueUserAndStation() {
        favoriteRepository.save(Favorite.builder()
                .user(testUser1)
                .stationId(500L)
                .stationTitle("Constraint Check Hub")
                .build());

        // Direct persistence bypassing service layer should violate unique constraint
        assertThatThrownBy(() -> {
            favoriteRepository.saveAndFlush(Favorite.builder()
                    .user(testUser1)
                    .stationId(500L)
                    .stationTitle("Duplicate Constraint Check Hub")
                    .build());
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}
