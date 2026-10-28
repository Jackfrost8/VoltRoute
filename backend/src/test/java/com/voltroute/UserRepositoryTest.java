package com.voltroute;

import com.voltroute.modules.favorite.domain.Favorite;
import com.voltroute.modules.user.domain.Role;
import com.voltroute.modules.user.domain.RoleName;
import com.voltroute.modules.user.domain.User;
import com.voltroute.modules.favorite.repository.FavoriteRepository;
import com.voltroute.modules.user.repository.RoleRepository;
import com.voltroute.modules.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Test
    @DisplayName("Should persist and retrieve user with role")
    void shouldPersistAndRetrieveUserWithRole() {
        // Given
        Role role = roleRepository.save(Role.builder()
                .name(RoleName.ROLE_USER)
                .build());

        User user = User.builder()
                .email("test.driver@voltroute.internal")
                .firstName("Alex")
                .lastName("Rivera")
                .password("$2a$12$hashedPasswordPlaceholder")
                .roles(Set.of(role))
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();

        Optional<User> found = userRepository.findByEmail("test.driver@voltroute.internal");
        assertThat(found).isPresent();
        assertThat(found.get().getFirstName()).isEqualTo("Alex");
        assertThat(found.get().getRoles()).hasSize(1);
        assertThat(found.get().getRoles().iterator().next().getName()).isEqualTo(RoleName.ROLE_USER);
    }

    @Test
    @DisplayName("Should verify user existence by email")
    void shouldVerifyUserExistenceByEmail() {
        // Given
        User user = User.builder()
                .email("exists@voltroute.internal")
                .firstName("Morgan")
                .lastName("Lee")
                .password("$2a$12$hashedPasswordPlaceholder")
                .build();
        userRepository.save(user);

        // When & Then
        assertThat(userRepository.existsByEmail("exists@voltroute.internal")).isTrue();
        assertThat(userRepository.existsByEmail("nonexistent@voltroute.internal")).isFalse();
    }

    @Test
    @DisplayName("Should persist and query favorite station for user")
    void shouldPersistAndQueryFavorites() {
        // Given
        User user = userRepository.save(User.builder()
                .email("fav.user@voltroute.internal")
                .firstName("Taylor")
                .lastName("Swift")
                .password("$2a$12$hashedPasswordPlaceholder")
                .build());

        Favorite favorite = Favorite.builder()
                .user(user)
                .stationId(192837L)
                .stationTitle("Central EV Supercharger Station")
                .build();
        favoriteRepository.save(favorite);

        // When
        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        // Then
        assertThat(favorites).hasSize(1);
        assertThat(favorites.get(0).getStationId()).isEqualTo(192837L);
        assertThat(favorites.get(0).getCreatedAt()).isNotNull();
        assertThat(favoriteRepository.existsByUserIdAndStationId(user.getId(), 192837L)).isTrue();
    }
}
