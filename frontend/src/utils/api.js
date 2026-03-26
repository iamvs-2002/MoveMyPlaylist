/**
 * Client-side API Utilities
 * Provides standardized API calls and response handling
 */

import axios from "axios";

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Include cookies for session management
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Standard API Response Structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Human-readable message
 * @property {*} data - Response data (optional)
 * @property {Object} meta - Metadata like pagination, timestamps (optional)
 * @property {Object} error - Error details (only present when success is false)
 */

/**
 * Standard API Error Structure
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {number} statusCode - HTTP status code
 * @property {string} code - Error code for client handling
 * @property {*} details - Additional error details
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isApiError = true;
  }
}

/**
 * Process API response and extract data or throw error
 * @param {Object} response - Axios response object
 * @returns {*} Extracted data from successful response
 * @throws {ApiError} If response indicates an error
 */
const processResponse = (response) => {
  const { data } = response;

  // Check if response follows our standard format
  if (data && typeof data.success === "boolean") {
    if (data.success) {
      return data.data !== undefined ? data.data : data;
    } else {
      // Handle standardized error response
      const { error, message } = data;
      throw new ApiError(
        message || "API request failed",
        error?.statusCode || response.status,
        error?.code || "UNKNOWN_ERROR",
        error?.details || null,
      );
    }
  }

  // Fallback for non-standard responses
  return data;
};

/**
 * Handle API errors and convert them to standardized format
 * @param {Error} error - Error object from axios or other sources
 * @returns {ApiError} Standardized API error
 */
const handleApiError = (error) => {
  if (error.isApiError) {
    return error; // Already an ApiError
  }

  if (axios.isAxiosError(error)) {
    const { response, request, message } = error;

    if (response) {
      // Server responded with error status
      const { status, data } = response;

      if (data && typeof data.success === "boolean" && !data.success) {
        // Standardized error response
        const { error: errorData } = data;
        return new ApiError(
          data.message || "Request failed",
          errorData?.statusCode || status,
          errorData?.code || "HTTP_ERROR",
          errorData?.details || null,
        );
      }

      // Non-standard error response
      return new ApiError(
        data?.message || message || "Request failed",
        status,
        "HTTP_ERROR",
        data || null,
      );
    } else if (request) {
      // Request was made but no response received
      return new ApiError(
        "No response received from server",
        0,
        "NETWORK_ERROR",
      );
    } else {
      // Request setup error
      return new ApiError(
        message || "Request setup failed",
        0,
        "REQUEST_ERROR",
      );
    }
  }

  // Generic error
  return new ApiError(
    error.message || "An unexpected error occurred",
    0,
    "UNKNOWN_ERROR",
  );
};

/**
 * Make a GET request
 * @param {string} url - API endpoint
 * @param {Object} config - Additional axios config
 * @returns {Promise<*>} Response data
 */
const get = async (url, config = {}) => {
  try {
    const response = await apiClient.get(url, config);
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a POST request
 * @param {string} url - API endpoint
 * @param {*} data - Request data
 * @param {Object} config - Additional axios config
 * @returns {Promise<*>} Response data
 */
const post = async (url, data = null, config = {}) => {
  try {
    const response = await apiClient.post(url, data, config);
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a PUT request
 * @param {string} url - API endpoint
 * @param {*} data - Request data
 * @param {Object} config - Additional axios config
 * @returns {Promise<*>} Response data
 */
const put = async (url, data = null, config = {}) => {
  try {
    const response = await apiClient.put(url, data, config);
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a DELETE request
 * @param {string} url - API endpoint
 * @param {Object} config - Additional axios config
 * @returns {Promise<*>} Response data
 */
const del = async (url, config = {}) => {
  try {
    const response = await apiClient.delete(url, config);
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a PATCH request
 * @param {string} url - API endpoint
 * @param {*} data - Request data
 * @param {Object} config - Additional axios config
 * @returns {Promise<*>} Response data
 */
const patch = async (url, data = null, config = {}) => {
  try {
    const response = await apiClient.patch(url, data, config);
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload file(s) with progress tracking
 * @param {string} url - API endpoint
 * @param {FormData} formData - Form data containing files
 * @param {Function} onProgress - Progress callback function
 * @param {Object} config - Additional axios config
 * @returns {Promise<*>} Response data
 */
const upload = async (url, formData, onProgress = null, config = {}) => {
  try {
    const uploadConfig = {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
      ...(onProgress && {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted, progressEvent);
        },
      }),
    };

    const response = await apiClient.post(url, formData, uploadConfig);
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Set authentication token for subsequent requests
 * @param {string} token - JWT or other authentication token
 */
const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

/**
 * Clear authentication token
 */
const clearAuthToken = () => {
  delete apiClient.defaults.headers.common["Authorization"];
};

/**
 * Set request interceptor for common headers or transformations
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    if (config.method === "get") {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Set response interceptor for common response handling
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - could trigger logout or token refresh
      console.warn("Unauthorized request detected");
    }
    return Promise.reject(error);
  },
);

// Export all utilities
export {
  // HTTP methods
  get,
  post,
  put,
  del,
  patch,
  upload,

  // Authentication
  setAuthToken,
  clearAuthToken,

  // Error handling
  ApiError,
  handleApiError,

  // Configuration
  apiClient,
  API_BASE_URL,
};
