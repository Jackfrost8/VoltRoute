import apiClient from './client';

/**
 * Charging station API service managing nearby queries, city search, and detail lookups.
 */
export const stationService = {
  /**
   * Retrieves charging stations within a geographic radius.
   * @param {Object} params { latitude, longitude, radiusKm, maxResults, connectionTypeId, minPowerKw }
   * @returns {Promise<Array>} List of StationSummaryDto objects
   */
  async getNearbyStations(params) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/stations', { params: cleanParams });
    return response.data || [];
  },

  /**
   * Searches charging stations by city/town and country.
   * @param {Object} params { city, countryCode, latitude, longitude, radiusKm, maxResults }
   * @returns {Promise<Array>} List of StationSummaryDto objects
   */
  async searchStations(params) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/stations/search', { params: cleanParams });
    return response.data || [];
  },

  /**
   * Retrieves detailed profile for a specific station ID.
   * @param {number|string} stationId
   * @returns {Promise<Object>} StationDetailDto
   */
  async getStationById(stationId) {
    const response = await apiClient.get(`/stations/${stationId}`);
    return response.data;
  },
};

export default stationService;
