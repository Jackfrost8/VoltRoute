package com.voltroute.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "favorites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // We only store the stationId from OpenChargeMap, not the full station details
    @Column(nullable = false)
    private String stationId;
    
    @Column
    private String stationName;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime addedAt;
}
