package com.voltroute.service;

import com.voltroute.dto.FavoriteDTO;

import java.util.List;

public interface FavoriteService {
    FavoriteDTO addFavorite(Long userId, String stationId);
    void removeFavorite(Long userId, String stationId);
    List<FavoriteDTO> getUserFavorites(Long userId);
}
