package com.voltroute.modules.favorite.repository;

import com.voltroute.modules.favorite.domain.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for user favorite charging stations.
 */
@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Favorite> findByUserIdAndStationId(Long userId, Long stationId);

    boolean existsByUserIdAndStationId(Long userId, Long stationId);

    void deleteByUserIdAndStationId(Long userId, Long stationId);
}
