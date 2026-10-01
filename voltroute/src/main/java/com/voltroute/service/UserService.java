package com.voltroute.service;

import com.voltroute.dto.UserDTO;

public interface UserService {
    UserDTO getProfile(Long userId);
    UserDTO updateProfile(Long userId, UserDTO userDTO);
    void deleteAccount(Long userId);
}
