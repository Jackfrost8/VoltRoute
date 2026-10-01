package com.voltroute.service.impl;

import com.voltroute.dto.AuthResponse;
import com.voltroute.dto.LoginRequest;
import com.voltroute.dto.RegisterRequest;
import com.voltroute.entity.Role;
import com.voltroute.entity.User;
import com.voltroute.enums.RoleType;
import com.voltroute.exception.ApiException;
import com.voltroute.repository.RoleRepository;
import com.voltroute.repository.UserRepository;
import com.voltroute.security.JwtService;
import com.voltroute.security.UserPrincipal;
import com.voltroute.service.AuthService;
import com.voltroute.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final MapperUtil mapperUtil;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email is already registered");
        }

        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.ROLE_USER).build()));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .build();

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(UserPrincipal.create(user));
        return new AuthResponse(jwtToken, mapperUtil.toUserDTO(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String jwtToken = jwtService.generateToken(userPrincipal);
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("User not found"));

        return new AuthResponse(jwtToken, mapperUtil.toUserDTO(user));
    }
}
