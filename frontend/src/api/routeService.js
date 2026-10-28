import apiClient from './client';

/**
 * Route planning and charging stops recommendation API service.
 */
export const routeService = {
  /**
   * Plans an EV driving route between origin and destination coordinates,
   * retrieving polyline geometry, trip distance, duration, and ranked charging stops.
   *
   * @param {Object} params Route plan parameters
   * @returns {Promise<Object>} RoutePlanResponse
   */
  async planRoute(params) {
    if (!params.originLatitude || !params.originLongitude) {
      throw new Error('Origin coordinates are required.');
    }
    if (!params.destinationLatitude || !params.destinationLongitude) {
      throw new Error('Destination coordinates are required.');
    }

    const payload = {
      originLatitude: Number(params.originLatitude),
      originLongitude: Number(params.originLongitude),
      originName: params.originName || undefined,
      destinationLatitude: Number(params.destinationLatitude),
      destinationLongitude: Number(params.destinationLongitude),
      destinationName: params.destinationName || undefined,
      vehicleRangeKm: params.vehicleRangeKm ? Number(params.vehicleRangeKm) : undefined,
      currentBatteryPercent: params.currentBatteryPercent ? Number(params.currentBatteryPercent) : undefined,
      batteryCapacityKwh: params.batteryCapacityKwh ? Number(params.batteryCapacityKwh) : undefined,
      consumptionKwhPer100Km: params.consumptionKwhPer100Km ? Number(params.consumptionKwhPer100Km) : undefined,
      minPowerKw: params.minPowerKw ? Number(params.minPowerKw) : undefined,
      connectorType: params.connectorType && params.connectorType !== 'all' ? params.connectorType : undefined,
      maxDetourKm: params.maxDetourKm ? Number(params.maxDetourKm) : 15.0,
    };

    const response = await apiClient.post('/routes/plan', payload);
    return response.data;
  },
};

export default routeService;
