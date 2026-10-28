package com.voltroute;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltroute.modules.user.domain.Role;
import com.voltroute.modules.user.domain.RoleName;
import com.voltroute.modules.user.dto.LoginRequest;
import com.voltroute.modules.user.dto.RegisterRequest;
import com.voltroute.modules.user.repository.RoleRepository;
import com.voltroute.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        if (!roleRepository.existsByName(RoleName.ROLE_USER)) {
            roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build());
        }
    }

    @Test
    @DisplayName("POST /api/auth/register - Successfully register new user")
    void register_shouldSucceedWithValidData() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@voltroute.com")
                .password("SecurePass123")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("User registered successfully"))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("newuser@voltroute.com"))
                .andExpect(jsonPath("$.data.user.firstName").value("John"))
                .andExpect(jsonPath("$.data.user.lastName").value("Doe"))
                .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_USER")))
                .andExpect(jsonPath("$.data.user.roles", not(hasItem("ROLE_ADMIN"))));
    }

    @Test
    @DisplayName("POST /api/auth/register - Rejects privilege escalation: unexpected roles payload is ignored")
    void register_shouldNotGrantAdminPrivilegesToOrdinaryUsers() throws Exception {
        String payloadWithAdminAttempt = """
                {
                    "email": "attacker@voltroute.com",
                    "password": "Password123!",
                    "firstName": "Malicious",
                    "lastName": "User",
                    "roles": ["ROLE_ADMIN"]
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithAdminAttempt))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_USER")))
                .andExpect(jsonPath("$.data.user.roles", not(hasItem("ROLE_ADMIN"))));
    }

    @Test
    @DisplayName("POST /api/auth/register - Fail on duplicate email (exact and case-insensitive)")
    void register_shouldFailOnDuplicateEmail() throws Exception {
        RegisterRequest first = RegisterRequest.builder()
                .email("unique@voltroute.com")
                .password("Password123")
                .firstName("Alice")
                .lastName("Smith")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        // Duplicate with different casing
        RegisterRequest duplicate = RegisterRequest.builder()
                .email("UNIQUE@voltroute.com")
                .password("DifferentPass456")
                .firstName("Alice")
                .lastName("Smith")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("Email is already registered")));
    }

    @Test
    @DisplayName("POST /api/auth/register - Fail when required fields are missing or invalid")
    void register_shouldFailOnValidationErrors() throws Exception {
        RegisterRequest invalid = RegisterRequest.builder()
                .email("invalid-email")
                .password("123") // too short (< 6 chars)
                .firstName("")
                .lastName("")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists())
                .andExpect(jsonPath("$.validationErrors.firstName").exists())
                .andExpect(jsonPath("$.validationErrors.lastName").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login - Successfully login with valid credentials")
    void login_shouldSucceedWithValidCredentials() throws Exception {
        // First register
        RegisterRequest reg = RegisterRequest.builder()
                .email("loginuser@voltroute.com")
                .password("MySecretPass123")
                .firstName("Bob")
                .lastName("Builder")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        // Then login with mixed case email
        LoginRequest login = LoginRequest.builder()
                .email("LOGINUSER@voltroute.com")
                .password("MySecretPass123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.email").value("loginuser@voltroute.com"))
                .andExpect(jsonPath("$.data.user.firstName").value("Bob"));
    }

    @Test
    @DisplayName("POST /api/auth/login - Fail with wrong password")
    void login_shouldFailWithWrongPassword() throws Exception {
        RegisterRequest reg = RegisterRequest.builder()
                .email("user1@voltroute.com")
                .password("CorrectPassword123")
                .firstName("Test")
                .lastName("User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest wrongLogin = LoginRequest.builder()
                .email("user1@voltroute.com")
                .password("WrongPassword999")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/login - Fail for unknown user without disclosing existence")
    void login_shouldFailForUnknownUser() throws Exception {
        LoginRequest unknown = LoginRequest.builder()
                .email("ghost@voltroute.com")
                .password("AnyPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unknown)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/login - Fail when fields are missing")
    void login_shouldFailOnMissingFields() throws Exception {
        LoginRequest blank = LoginRequest.builder()
                .email("")
                .password("")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blank)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }
}
