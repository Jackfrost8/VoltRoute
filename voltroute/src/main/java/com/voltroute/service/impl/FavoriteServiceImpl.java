package com.voltroute.service.impl;

import com.voltroute.client.OpenChargeMapClient;
import com.voltroute.dto.FavoriteDTO;
import com.voltroute.dto.StationResponse;
import com.voltroute.entity.Favorite;
import com.voltroute.entity.User;
import com.voltroute.exception.ApiException;
import com.voltroute.exception.ResourceNotFoundException;
import com.voltroute.repository.FavoriteRepository;
import com.voltroute.repository.UserRepository;
import com.voltroute.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final OpenChargeMapClient openChargeMapClient;

    @Override
    @Transactional
    public FavoriteDTO addFavorite(Long userId, String stationId) {
        if (favoriteRepository.existsByUserIdAndStationId(userId, stationId)) {
            throw new ApiException("Station is already added to favorites");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StationResponse station = openChargeMapClient.getStationById(stationId);
        if (station == null) {
            throw new ResourceNotFoundException("Charging station not found with ID: " + stationId);
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .stationId(stationId)
                .stationName(station.getName() != null ? station.getName() : "Unknown Station")
                .build();

        Favorite savedFavorite = favoriteRepository.save(favorite);

        return FavoriteDTO.builder()
                .id(savedFavorite.getId())
                .stationId(savedFavorite.getStationId())
                .stationName(savedFavorite.getStationName())
                .addedAt(savedFavorite.getAddedAt())
                .build();
    }

    @Override
    @Transactional
    public void removeFavorite(Long userId, String stationId) {
        Favorite favorite = favoriteRepository.findByUserIdAndStationId(userId, stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite not found"));
        
        favoriteRepository.delete(favorite);
    }

    @Override
    public List<FavoriteDTO> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(favorite -> FavoriteDTO.builder()
                        .id(favorite.getId())
                        .stationId(favorite.getStationId())
                        .stationName(favorite.getStationName())
                        .addedAt(favorite.getAddedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
