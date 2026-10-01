package com.voltroute.controller;

import com.voltroute.dto.UserDTO;
import com.voltroute.response.ApiResponse;
import com.voltroute.response.SuccessResponse;
import com.voltroute.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Administrator APIs")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users (Admin only)")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.<List<UserDTO>>builder()
                .success(true)
                .message("Users retrieved successfully")
                .data(users)
                .build());
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user by ID (Admin only)")
    public ResponseEntity<SuccessResponse> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(new SuccessResponse(true, "User deleted successfully"));
    }
    
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard stats")
    public ResponseEntity<ApiResponse<String>> getDashboardStats() {
        // Mocking dashboard stats
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Dashboard stats retrieved")
                .data("Dashboard Stats Data (Mocked)")
                .build());
    }
}
