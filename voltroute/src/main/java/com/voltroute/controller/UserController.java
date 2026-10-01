package com.voltroute.controller;

import com.voltroute.dto.UserDTO;
import com.voltroute.response.ApiResponse;
import com.voltroute.response.SuccessResponse;
import com.voltroute.security.UserPrincipal;
import com.voltroute.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User", description = "User Profile APIs")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserDTO userDTO = userService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder()
                .success(true)
                .message("Profile retrieved successfully")
                .data(userDTO)
                .build());
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody UserDTO userDTO) {
        
        UserDTO updatedUser = userService.updateProfile(currentUser.getId(), userDTO);
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder()
                .success(true)
                .message("Profile updated successfully")
                .data(updatedUser)
                .build());
    }

    @DeleteMapping("/account")
    @Operation(summary = "Delete user account")
    public ResponseEntity<SuccessResponse> deleteAccount(@AuthenticationPrincipal UserPrincipal currentUser) {
        userService.deleteAccount(currentUser.getId());
        return ResponseEntity.ok(new SuccessResponse(true, "Account deleted successfully"));
    }
}
