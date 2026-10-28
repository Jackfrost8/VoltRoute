package com.voltroute.modules.favorite.domain;

import com.voltroute.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing a user-specific EV charging station favorite / bookmark.
 * Strictly scoped to an authenticated user with a unique constraint on (user_id, station_id).
 */
@Entity
@Table(
        name = "favorites",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_favorites_user_station", columnNames = {"user_id", "station_id"})
        },
        indexes = {
                @Index(name = "idx_favorites_user_id", columnList = "user_id"),
                @Index(name = "idx_favorites_station_id", columnList = "station_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "station_id", nullable = false)
    private Long stationId;

    @Column(name = "station_title", nullable = false, length = 255)
    private String stationTitle;

    @Column(name = "operator_name", length = 255)
    private String operatorName;

    @Column(name = "address_line", length = 255)
    private String addressLine;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state_or_province", length = 100)
    private String stateOrProvince;

    @Column(name = "country_code", length = 10)
    private String countryCode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "max_power_kw")
    private Double maxPowerKw;

    @Column(name = "total_connectors")
    private Integer totalConnectors;

    @Column(name = "connector_types", length = 255)
    private String connectorTypes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
