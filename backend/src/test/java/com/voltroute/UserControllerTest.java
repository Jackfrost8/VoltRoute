package com.voltroute;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltroute.modules.user.domain.Role;
import com.voltroute.modules.user.domain.RoleName;
import com.voltroute.modules.user.dto.RegisterRequest;
import com.voltroute.modules.user.repository.RoleRepository;
import com.voltroute.modules.user.repository.UserRepository;
import com.voltroute.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        if (!roleRepository.existsByName(RoleName.ROLE_USER)) {
            roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build());
        }
    }

    private String registerAndGetToken(String email, String firstName, String lastName) throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .password("StrongPass123!")
                .firstName(firstName)
                .lastName(lastName)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        return jsonNode.path("data").path("token").asText();
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns authenticated user's profile with valid Bearer token")
    void getProfile_shouldSucceedWithValidToken() throws Exception {
        String token = registerAndGetToken("alice@voltroute.com", "Alice", "Wonder");

        mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.email").value("alice@voltroute.com"))
                .andExpect(jsonPath("$.data.firstName").value("Alice"))
                .andExpect(jsonPath("$.data.lastName").value("Wonder"))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_USER")));
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns 401 when Authorization header is missing")
    void getProfile_shouldFailWhenTokenMissing() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns 401 when token is tampered or invalid")
    void getProfile_shouldFailWithTamperedToken() throws Exception {
        String token = registerAndGetToken("tamper@voltroute.com", "Bob", "Builder");
        String badToken = token.substring(0, token.length() - 8) + "invalid9";

        mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + badToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns 401 when token is expired")
    void getProfile_shouldFailWithExpiredToken() throws Exception {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(
                "dGVzdF9qd3Rfc2VjcmV0X2tleV9mb3JfdGVzdGluZ19wdXJwb3Nlc19vbmx5MTIzNDU2Nzg5MA==",
                -10000
        );
        String expiredToken = expiredProvider.generateToken(999L, "expired@voltroute.com", List.of());

        mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns 401 when token is forged with untrusted signing key")
    void getProfile_shouldFailWithForgedSecretKeyToken() throws Exception {
        JwtTokenProvider attackerProvider = new JwtTokenProvider(
                "YXR0YWNrZXJfaGFja2VkX2tleV9mb3JfZm9yZ2luZ19qd3RfdG9rZW5zMTIzNDU2",
                3600000
        );
        String forgedToken = attackerProvider.generateToken(1L, "alice@voltroute.com", List.of());

        mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns 401 when token is malformed string")
    void getProfile_shouldFailWithMalformedToken() throws Exception {
        mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not.a.valid.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/users/profile - Returns 401 when Authorization header lacks Bearer prefix")
    void getProfile_shouldFailWhenAuthorizationHeaderLacksBearerPrefix() throws Exception {
        String token = registerAndGetToken("prefix@voltroute.com", "Pre", "Fix");

        mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/users/profile - Ensures users cannot access other users' private profiles")
    void getProfile_ensuresStrictUserIsolation() throws Exception {
        String tokenA = registerAndGetToken("user_a@voltroute.com", "User", "Alpha");
        String tokenB = registerAndGetToken("user_b@voltroute.com", "User", "Beta");

        MvcResult resultA = mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult resultB = mockMvc.perform(get("/api/users/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode userA = objectMapper.readTree(resultA.getResponse().getContentAsString()).path("data");
        JsonNode userB = objectMapper.readTree(resultB.getResponse().getContentAsString()).path("data");

        assertThat(userA.path("email").asText()).isEqualTo("user_a@voltroute.com");
        assertThat(userB.path("email").asText()).isEqualTo("user_b@voltroute.com");
        assertThat(userA.path("id").asLong()).isNotEqualTo(userB.path("id").asLong());
    }
}
