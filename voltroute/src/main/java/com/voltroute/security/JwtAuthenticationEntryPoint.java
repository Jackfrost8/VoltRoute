package com.voltroute.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltroute.response.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .success(false)
                .message("Unauthorized: " + authException.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        final ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Support for Java 8 Time API
        mapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
