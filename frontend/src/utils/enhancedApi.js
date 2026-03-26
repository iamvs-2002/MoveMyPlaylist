import axios from "axios";

/**
 * Enhanced Client-side API Utilities
 * Provides robust API calls with retry logic and circuit breaker pattern
 */

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_TIMEOUT = 30000; // 30 seconds

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Circuit breaker state
const circuitBreaker = {
  state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
  failures: 0,
  lastFailure: 0,
  threshold: 5, // Open circuit after 5 failures
  resetTimeout: 30000, // Reset after 30 seconds
};

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (attempt) => {
  const delay =
    RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Check if circuit breaker is open
 */
const isCircuitOpen = () => {
  if (circuitBreaker.state === "OPEN") {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
    if (timeSinceLastFailure > circuitBreaker.resetTimeout) {
      circuitBreaker.state = "HALF_OPEN";
      return false;
    }
    return true;
  }
  return false;
};

/**
 * Record failure for circuit breaker
 */
const recordFailure = () => {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();

  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.state = "OPEN";
  }
};

/**
 * Record success for circuit breaker
 */
const recordSuccess = () => {
  circuitBreaker.failures = 0;
  circuitBreaker.state = "CLOSED";
};

/**
 * Sleep utility function
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Include cookies for session management
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Make HTTP request with retry logic
 */
const makeRequest = async (config, retryCount = 0) => {
  // Check circuit breaker
  if (isCircuitOpen()) {
    throw new Error("Service temporarily unavailable. Please try again later.");
  }

  try {
    const response = await apiClient(config);
    recordSuccess();
    return response;
  } catch (error) {
    recordFailure();

    // Don't retry on client errors (4xx) except rate limiting
    if (
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      if (error.response.status === 429) {
        // Rate limiting - wait and retry
        const retryAfter =
          error.response.headers["retry-after"] || calculateDelay(retryCount);
        await sleep(retryAfter * 1000);

        if (retryCount < RETRY_CONFIG.maxRetries) {
          return makeRequest(config, retryCount + 1);
        }
      }
      // Other client errors - don't retry
      throw error;
    }

    // Don't retry on the last attempt
    if (retryCount >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    // Wait before retry
    const delay = calculateDelay(retryCount);
    await sleep(delay);

    // Retry the request
    return makeRequest(config, retryCount + 1);
  }
};

/**
 * Process API response and extract data or throw error
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
      throw new Error(message || "API request failed");
    }
  }

  // Fallback for non-standard responses
  return data;
};

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
 * Handle API errors and convert them to standardized format
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
 * Make a GET request with retry logic
 */
const get = async (url, config = {}) => {
  try {
    const response = await makeRequest({
      method: "GET",
      url,
      ...config,
    });
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a POST request with retry logic
 */
const post = async (url, data = null, config = {}) => {
  try {
    const response = await makeRequest({
      method: "POST",
      url,
      data,
      ...config,
    });
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a PUT request with retry logic
 */
const put = async (url, data = null, config = {}) => {
  try {
    const response = await makeRequest({
      method: "PUT",
      url,
      data,
      ...config,
    });
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a DELETE request with retry logic
 */
const del = async (url, config = {}) => {
  try {
    const response = await makeRequest({
      method: "DELETE",
      url,
      ...config,
    });
    return processResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get circuit breaker status
 */
const getCircuitStatus = () => ({
  state: circuitBreaker.state,
  failures: circuitBreaker.failures,
  lastFailure: circuitBreaker.lastFailure,
  threshold: circuitBreaker.threshold,
});

/**
 * Reset circuit breaker
 */
const resetCircuit = () => {
  circuitBreaker.state = "CLOSED";
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailure = 0;
};

// Set request interceptor for common headers or transformations
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

// Set response interceptor for common response handling
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
  // HTTP methods with retry logic
  get,
  post,
  put,
  del,

  // Error handling
  ApiError,
  handleApiError,

  // Circuit breaker
  getCircuitStatus,
  resetCircuit,

  // Configuration
  apiClient,
  API_BASE_URL,
};
