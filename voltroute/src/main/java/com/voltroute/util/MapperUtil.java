package com.voltroute.util;

import com.voltroute.dto.UserDTO;
import com.voltroute.entity.Role;
import com.voltroute.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class MapperUtil {

    public UserDTO toUserDTO(User user) {
        if (user == null) {
            return null;
        }
        
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .map(Enum::name)
                        .collect(Collectors.toList()))
                .build();
    }
}
