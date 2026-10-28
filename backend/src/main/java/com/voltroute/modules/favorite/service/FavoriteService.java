package com.voltroute.modules.favorite.service;

import com.voltroute.modules.favorite.dto.FavoriteDto;
import com.voltroute.modules.favorite.dto.FavoriteRequest;

import java.util.List;

/**
 * Service interface for managing user-specific charging station favorites.
 */
public interface FavoriteService {

    /**
     * Retrieves all favorites bookmarked by the authenticated user.
     *
     * @param userEmail the authenticated user's email
     * @return list of favorite DTOs
     */
    List<FavoriteDto> getFavoritesForUser(String userEmail);

    /**
     * Adds a charging station to the authenticated user's favorites.
     * Prevents duplicate entries per user.
     *
     * @param userEmail the authenticated user's email
     * @param request   the favorite details
     * @return the created favorite DTO
     */
    FavoriteDto addFavorite(String userEmail, FavoriteRequest request);

    /**
     * Removes a charging station from the authenticated user's favorites by external station ID.
     *
     * @param userEmail the authenticated user's email
     * @param stationId the external station identifier
     */
    void removeFavorite(String userEmail, Long stationId);

    /**
     * Checks if a specific station is bookmarked by the user.
     *
     * @param userEmail the authenticated user's email
     * @param stationId the external station identifier
     * @return true if favorited, false otherwise
     */
    boolean isFavorite(String userEmail, Long stationId);
}
