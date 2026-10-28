package com.voltroute.modules.favorite.controller;

import com.voltroute.common.response.ApiResponse;
import com.voltroute.modules.favorite.dto.FavoriteDto;
import com.voltroute.modules.favorite.dto.FavoriteRequest;
import com.voltroute.modules.favorite.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for authenticated user charging-station favorites management.
 * All endpoints require Bearer JWT authentication and operate strictly on the caller's data.
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "Endpoints for managing user-specific charging station bookmarks")
@SecurityRequirement(name = "bearerAuth")
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * Retrieves all favorites for the authenticated user.
     */
    @GetMapping
    @Operation(
            summary = "Get user favorite stations",
            description = "Returns all charging stations bookmarked by the authenticated user, ordered by creation date descending."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Favorites retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Valid JWT token required")
    })
    public ResponseEntity<ApiResponse<List<FavoriteDto>>> getFavorites(Principal principal) {
        List<FavoriteDto> favorites = favoriteService.getFavoritesForUser(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Retrieved " + favorites.size() + " favorites", favorites));
    }

    /**
     * Bookmarks a charging station for the authenticated user.
     */
    @PostMapping
    @Operation(
            summary = "Add station to favorites",
            description = "Saves a charging station bookmark for the authenticated user. Rejects duplicate favorites with 409 Conflict."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Station bookmarked successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error on request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Valid JWT token required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Station is already in user favorites")
    })
    public ResponseEntity<ApiResponse<FavoriteDto>> addFavorite(
            @Valid @RequestBody FavoriteRequest request,
            Principal principal) {
        FavoriteDto favorite = favoriteService.addFavorite(principal.getName(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Station added to favorites", favorite));
    }

    /**
     * Removes a charging station from the authenticated user's favorites by external station ID.
     */
    @DeleteMapping("/{stationId}")
    @Operation(
            summary = "Remove station from favorites",
            description = "Removes a bookmarked station by its external station identifier. Returns 404 if not found in caller's favorites."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Favorite removed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - Valid JWT token required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Favorite not found for station ID")
    })
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @Parameter(description = "External Open Charge Map station identifier", example = "163371")
            @PathVariable Long stationId,
            Principal principal) {
        favoriteService.removeFavorite(principal.getName(), stationId);
        return ResponseEntity.ok(ApiResponse.ok("Favorite removed successfully", null));
    }
}
