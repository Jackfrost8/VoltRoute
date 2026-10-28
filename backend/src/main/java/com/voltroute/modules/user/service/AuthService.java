package com.voltroute.modules.user.service;

import com.voltroute.common.exception.ConflictException;
import com.voltroute.modules.user.domain.Role;
import com.voltroute.modules.user.domain.RoleName;
import com.voltroute.modules.user.domain.User;
import com.voltroute.modules.user.dto.AuthResponse;
import com.voltroute.modules.user.dto.LoginRequest;
import com.voltroute.modules.user.dto.RegisterRequest;
import com.voltroute.modules.user.dto.UserProfileDto;
import com.voltroute.modules.user.repository.RoleRepository;
import com.voltroute.modules.user.repository.UserRepository;
import com.voltroute.security.JwtTokenProvider;
import com.voltroute.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Service managing user authentication, registration, and credential verification.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Registers a new user account with normalized email, hashed password, and default ROLE_USER.
     *
     * @param request Validated registration parameters
     * @return AuthResponse containing signed JWT token and safe profile DTO
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Registration rejected: duplicate email '{}'", normalizedEmail);
            throw new ConflictException("Email is already registered: " + normalizedEmail);
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build()));

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .roles(new HashSet<>(Set.of(userRole)))
                .build();

        User savedUser = userRepository.save(user);
        log.info("Successfully registered user id={} email='{}'", savedUser.getId(), savedUser.getEmail());

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), principal.getAuthorities());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(UserProfileDto.fromEntity(savedUser))
                .build();
    }

    /**
     * Authenticates an existing user and returns a signed JWT token.
     *
     * @param request Validated login parameters
     * @return AuthResponse containing signed JWT token and safe profile DTO
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = jwtTokenProvider.generateToken(authentication);
        log.info("User id={} email='{}' logged in successfully", user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(UserProfileDto.fromEntity(user))
                .build();
    }
}
