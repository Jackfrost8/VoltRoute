package com.voltroute.modules.route.service;

import com.voltroute.modules.route.dto.RoutePlanRequest;
import com.voltroute.modules.route.dto.RoutePlanResponse;

/**
 * Service managing EV route planning, polyline geometry, and charging stop recommendations.
 */
public interface RouteService {

    /**
     * Plans a driving route between origin and destination, samples candidate charging stations,
     * evaluates deterministic rankings, and computes trip feasibility.
     *
     * @param request Route planning parameters
     * @return RoutePlanResponse with geometry and recommended charging stops
     */
    RoutePlanResponse planRoute(RoutePlanRequest request);
}
