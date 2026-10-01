package com.voltroute.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SuccessResponse {
    private boolean success;
    private String message;

    public SuccessResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
