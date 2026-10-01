package com.voltroute.util;

public class Constants {
    
    private Constants() {
        // Private constructor to prevent instantiation
    }

    public static final String API_V1 = "/api";
    public static final String API_AUTH = API_V1 + "/auth";
    public static final String API_USERS = API_V1 + "/users";
    public static final String API_STATIONS = API_V1 + "/stations";
    public static final String API_FAVORITES = API_V1 + "/favorites";
    public static final String API_ADMIN = API_V1 + "/admin";
    public static final String API_AI = API_V1 + "/ai";
    
    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
}
