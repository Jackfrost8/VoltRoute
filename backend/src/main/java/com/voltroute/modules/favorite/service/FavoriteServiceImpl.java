package com.voltroute.modules.favorite.service;

import com.voltroute.common.exception.ConflictException;
import com.voltroute.common.exception.ResourceNotFoundException;
import com.voltroute.modules.favorite.domain.Favorite;
import com.voltroute.modules.favorite.dto.FavoriteDto;
import com.voltroute.modules.favorite.dto.FavoriteRequest;
import com.voltroute.modules.favorite.repository.FavoriteRepository;
import com.voltroute.modules.user.domain.User;
import com.voltroute.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for managing user charging-station favorites with
 * cross-user authorization enforcement and duplicate prevention.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteDto> getFavoritesForUser(String userEmail) {
        User user = findUserByEmail(userEmail);
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(FavoriteDto::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public FavoriteDto addFavorite(String userEmail, FavoriteRequest request) {
        User user = findUserByEmail(userEmail);

        if (favoriteRepository.existsByUserIdAndStationId(user.getId(), request.getStationId())) {
            log.warn("User {} attempted to add duplicate favorite for station {}", user.getEmail(), request.getStationId());
            throw new ConflictException("Station " + request.getStationId() + " is already in your favorites");
        }

        String connectorString = request.getConnectorTypes() != null && !request.getConnectorTypes().isEmpty()
                ? String.join(", ", request.getConnectorTypes())
                : null;

        Favorite favorite = Favorite.builder()
                .user(user)
                .stationId(request.getStationId())
                .stationTitle(request.getStationTitle())
                .operatorName(request.getOperatorName())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .stateOrProvince(request.getStateOrProvince())
                .countryCode(request.getCountryCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .maxPowerKw(request.getMaxPowerKw())
                .totalConnectors(request.getTotalConnectors())
                .connectorTypes(connectorString)
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        log.info("Saved favorite id={} (stationId={}) for user={}", saved.getId(), saved.getStationId(), user.getEmail());
        return FavoriteDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public void removeFavorite(String userEmail, Long stationId) {
        User user = findUserByEmail(userEmail);

        Favorite favorite = favoriteRepository.findByUserIdAndStationId(user.getId(), stationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Favorite not found for station ID: " + stationId));

        favoriteRepository.delete(favorite);
        log.info("Removed favorite stationId={} for user={}", stationId, user.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorite(String userEmail, Long stationId) {
        User user = findUserByEmail(userEmail);
        return favoriteRepository.existsByUserIdAndStationId(user.getId(), stationId);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
