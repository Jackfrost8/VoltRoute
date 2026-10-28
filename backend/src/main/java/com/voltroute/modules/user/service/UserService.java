package com.voltroute.modules.user.service;

import com.voltroute.common.exception.ResourceNotFoundException;
import com.voltroute.modules.user.domain.User;
import com.voltroute.modules.user.dto.UserProfileDto;
import com.voltroute.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user profile retrieval and management.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Retrieves the profile of a user by their normalized email address.
     *
     * @param email The user email address
     * @return UserProfileDto safe user representation
     */
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        return UserProfileDto.fromEntity(user);
    }

    /**
     * Retrieves the profile of a user by their user ID.
     *
     * @param userId The user primary key ID
     * @return UserProfileDto safe user representation
     */
    @Transactional(readOnly = true)
    public UserProfileDto getUserProfileById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return UserProfileDto.fromEntity(user);
    }
}
