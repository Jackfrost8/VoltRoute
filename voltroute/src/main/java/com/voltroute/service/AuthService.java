package com.voltroute.service;

import com.voltroute.dto.AuthResponse;
import com.voltroute.dto.LoginRequest;
import com.voltroute.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
