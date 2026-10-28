package com.voltroute.modules.route.dto;

/**
 * Route feasibility classification based on battery state and charging stop availability.
 */
public enum RouteFeasibility {
    /**
     * Route is directly feasible on current battery state of charge without any charging stops.
     */
    FEASIBLE_DIRECT,

    /**
     * Route exceeds current battery range, and viable, high-ranking charging stops were identified.
     */
    FEASIBLE_WITH_STOPS,

    /**
     * Route exceeds vehicle battery range, but no compatible candidate stops were found along the corridor.
     */
    RANGE_CONSTRAINED_NO_STOPS_FOUND,

    /**
     * Route geometry computed, but vehicle battery range was not provided; estimates are unverified.
     */
    ESTIMATE_ONLY_NO_VEHICLE_DATA
}
