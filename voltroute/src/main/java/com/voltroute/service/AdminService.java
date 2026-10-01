package com.voltroute.service;

import com.voltroute.dto.UserDTO;

import java.util.List;

public interface AdminService {
    List<UserDTO> getAllUsers();
    void deleteUser(Long id);
}
