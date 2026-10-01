package com.voltroute.controller;

import com.voltroute.dto.FavoriteDTO;
import com.voltroute.response.ApiResponse;
import com.voltroute.response.SuccessResponse;
import com.voltroute.security.UserPrincipal;
import com.voltroute.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Favorites", description = "User Favorites APIs")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping
    @Operation(summary = "Add station to favorites")
    public ResponseEntity<ApiResponse<FavoriteDTO>> addFavorite(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam String stationId) {
        
        FavoriteDTO favorite = favoriteService.addFavorite(currentUser.getId(), stationId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<FavoriteDTO>builder()
                        .success(true)
                        .message("Station added to favorites")
                        .data(favorite)
                        .build());
    }

    @GetMapping
    @Operation(summary = "Get user's favorite stations")
    public ResponseEntity<ApiResponse<List<FavoriteDTO>>> getUserFavorites(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        List<FavoriteDTO> favorites = favoriteService.getUserFavorites(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.<List<FavoriteDTO>>builder()
                .success(true)
                .message("Favorites retrieved successfully")
                .data(favorites)
                .build());
    }

    @DeleteMapping("/{stationId}")
    @Operation(summary = "Remove station from favorites")
    public ResponseEntity<SuccessResponse> removeFavorite(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String stationId) {
        
        favoriteService.removeFavorite(currentUser.getId(), stationId);
        return ResponseEntity.ok(new SuccessResponse(true, "Station removed from favorites"));
    }
}
