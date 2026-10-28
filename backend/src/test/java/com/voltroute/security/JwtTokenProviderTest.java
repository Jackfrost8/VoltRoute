package com.voltroute.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String TEST_SECRET = "dGVzdF9qd3Rfc2VjcmV0X2tleV9mb3JfdGVzdGluZ19wdXJwb3Nlc19vbmx5MTIzNDU2Nzg5MA==";
    private static final long EXPIRATION_MS = 60000; // 1 minute

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("Should generate valid token with correct email and userId claims")
    void generateToken_shouldProduceValidClaims() {
        Long userId = 42L;
        String email = "driver@voltroute.com";
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));

        String token = jwtTokenProvider.generateToken(userId, email, authorities);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo(email);
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(userId);
    }

    @Test
    @DisplayName("Should reject tampered token with altered payload or signature")
    void validateToken_shouldRejectTamperedToken() {
        String token = jwtTokenProvider.generateToken(1L, "user@voltroute.com", List.of());
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertThat(jwtTokenProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("Should reject expired token")
    void validateToken_shouldRejectExpiredToken() {
        // Provider configured with negative expiration
        JwtTokenProvider expiredProvider = new JwtTokenProvider(TEST_SECRET, -1000);
        String expiredToken = expiredProvider.generateToken(1L, "user@voltroute.com", List.of());

        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("Should reject malformed token strings")
    void validateToken_shouldRejectMalformedToken() {
        assertThat(jwtTokenProvider.validateToken("not-a-valid-jwt-token")).isFalse();
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }
}
