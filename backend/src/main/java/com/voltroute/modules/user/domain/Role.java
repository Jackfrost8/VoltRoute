package com.voltroute.modules.user.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Role entity mapped to the PostgreSQL 'roles' table.
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 255)
    private RoleName name;
}
