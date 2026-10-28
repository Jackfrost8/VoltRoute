import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../api/client';

describe('ApiClient Interceptors & Error Envelope Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('client has expected base configuration', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.headers['Accept']).toBe('application/json');
    expect(apiClient.defaults.timeout).toBe(15000);
  });

  it('attaches Bearer authorization token if present in localStorage', async () => {
    const mockStorage = {
      getItem: vi.fn().mockReturnValue('active-jwt-token-xyz'),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    // Simulate request interceptor
    const requestInterceptor = apiClient.interceptors.request.handlers[0];
    const config = { headers: {} };
    const modifiedConfig = await requestInterceptor.fulfilled(config);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer active-jwt-token-xyz');
  });

  it('unwraps response.data from backend payload', () => {
    const responseInterceptor = apiClient.interceptors.response.handlers[0];
    const rawResponse = {
      data: {
        success: true,
        status: 200,
        message: 'Loaded stations',
        data: [{ id: 1 }],
      },
      status: 200,
    };

    const unwrapped = responseInterceptor.fulfilled(rawResponse);
    expect(unwrapped.data).toEqual([{ id: 1 }]);
    expect(unwrapped.success).toBe(true);
  });

  it('formats server error messages when backend returns ApiErrorResponse', async () => {
    const responseInterceptor = apiClient.interceptors.response.handlers[0];
    const mockAxiosError = {
      response: {
        status: 400,
        data: {
          success: false,
          status: 400,
          error: 'Bad Request',
          message: 'Latitude must be between -90.0 and 90.0',
        },
      },
    };

    await expect(responseInterceptor.rejected(mockAxiosError)).rejects.toThrow(
      'Latitude must be between -90.0 and 90.0'
    );
  });

  it('clears storage and fires auth-expired event on 401 Unauthorized', async () => {
    const removeItemSpy = vi.fn();
    const dispatchEventSpy = vi.fn();

    Object.defineProperty(globalThis, 'localStorage', {
      value: { removeItem: removeItemSpy, getItem: vi.fn() },
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { dispatchEvent: dispatchEventSpy },
      writable: true,
    });

    const responseInterceptor = apiClient.interceptors.response.handlers[0];
    const mock401Error = {
      response: {
        status: 401,
        data: {
          success: false,
          status: 401,
          message: 'Full authentication is required to access this resource',
        },
      },
    };

    try {
      await responseInterceptor.rejected(mock401Error);
    } catch (err) {
      expect(err.message).toBe('Full authentication is required to access this resource');
    }

    expect(removeItemSpy).toHaveBeenCalledWith('voltroute_token');
    expect(removeItemSpy).toHaveBeenCalledWith('voltroute_user');
    expect(dispatchEventSpy).toHaveBeenCalled();
  });
});
