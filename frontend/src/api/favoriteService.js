import apiClient from './client';

/**
 * Charging station Favorites API service.
 * Manages user-specific bookmarked charging stations.
 */
export const favoriteService = {
  /**
   * Retrieves all favorite charging stations bookmarked by the authenticated user.
   * @returns {Promise<Array>} List of FavoriteDto objects
   */
  async getFavorites() {
    const response = await apiClient.get('/favorites');
    return response.data || [];
  },

  /**
   * Adds a charging station to the authenticated user's favorites.
   * Maps StationSummaryDto or custom station object to FavoriteRequest schema.
   * @param {Object} station Station data
   * @returns {Promise<Object>} Created FavoriteDto
   */
  async addFavorite(station) {
    if (!station || !station.id) {
      throw new Error('Station ID is required to add a favorite.');
    }

    const payload = {
      stationId: Number(station.id),
      stationTitle: station.title || station.stationTitle || 'Charging Station',
      operatorName: station.operatorName || null,
      addressLine: station.location?.addressLine1 || station.addressLine || null,
      city: station.location?.city || station.city || null,
      stateOrProvince: station.location?.stateOrProvince || station.stateOrProvince || null,
      countryCode: station.location?.countryCode || station.countryCode || null,
      latitude:
        station.location?.latitude != null
          ? Number(station.location.latitude)
          : station.latitude != null
          ? Number(station.latitude)
          : null,
      longitude:
        station.location?.longitude != null
          ? Number(station.location.longitude)
          : station.longitude != null
          ? Number(station.longitude)
          : null,
      maxPowerKw:
        station.maxPowerKw != null && !isNaN(station.maxPowerKw)
          ? Number(station.maxPowerKw)
          : null,
      totalConnectors:
        station.totalConnectors != null && !isNaN(station.totalConnectors)
          ? Number(station.totalConnectors)
          : 0,
      connectorTypes: Array.isArray(station.connectorTypes) ? station.connectorTypes : [],
    };

    const response = await apiClient.post('/favorites', payload);
    return response.data;
  },

  /**
   * Removes a charging station from the authenticated user's favorites by external station ID.
   * @param {number|string} stationId
   * @returns {Promise<Object>} Backend response
   */
  async removeFavorite(stationId) {
    if (!stationId) {
      throw new Error('Station ID is required to remove a favorite.');
    }
    const response = await apiClient.delete(`/favorites/${stationId}`);
    return response;
  },

  /**
   * Checks whether a given station ID exists in a list of favorites.
   * @param {number|string} stationId
   * @param {Array} favoritesList
   * @returns {boolean}
   */
  isStationFavorited(stationId, favoritesList = []) {
    if (!stationId || !Array.isArray(favoritesList)) return false;
    const targetId = Number(stationId);
    return favoritesList.some((fav) => Number(fav.stationId) === targetId || Number(fav.id) === targetId);
  },
};

export default favoriteService;
