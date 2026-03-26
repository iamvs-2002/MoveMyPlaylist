/**
 * Error handling utilities for MoveMyPlaylist
 * Provides consistent error handling and user-friendly error messages
 */

// Common error types and their user-friendly messages
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: {
    title: "Connection Error",
    message:
      "Unable to connect to the server. Please check your internet connection and try again.",
    suggestion: "Check your internet connection and try again.",
    retryable: true,
  },

  TIMEOUT_ERROR: {
    title: "Request Timeout",
    message:
      "The request took too long to complete. This might be due to a slow connection.",
    suggestion: "Try again or check your internet connection.",
    retryable: true,
  },

  // Authentication errors
  AUTH_EXPIRED: {
    title: "Session Expired",
    message:
      "Your authentication session has expired. Please reconnect your accounts.",
    suggestion: "Go back to the transfer page and reconnect your platforms.",
    retryable: true,
  },

  AUTH_DENIED: {
    title: "Access Denied",
    message:
      "Access to your account was denied. This is required to transfer playlists.",
    suggestion:
      "Please try connecting again and grant the necessary permissions.",
    retryable: true,
  },

  // Platform-specific errors
  SPOTIFY_ERROR: {
    title: "Spotify Connection Error",
    message:
      "There was an issue connecting to Spotify. This might be temporary.",
    suggestion: "Try reconnecting your Spotify account.",
    retryable: true,
  },

  YOUTUBE_ERROR: {
    title: "YouTube Music Connection Error",
    message:
      "There was an issue connecting to YouTube Music. This might be temporary.",
    suggestion: "Try reconnecting your YouTube Music account.",
    retryable: true,
  },

  // Transfer errors
  TRANSFER_FAILED: {
    title: "Transfer Failed",
    message:
      "The playlist transfer could not be completed. This might be due to platform limitations.",
    suggestion:
      "Try again with a smaller playlist or check if all tracks are available.",
    retryable: true,
  },

  PLAYLIST_NOT_FOUND: {
    title: "Playlist Not Found",
    message: "The requested playlist could not be found or has been deleted.",
    suggestion: "Check if the playlist still exists and try again.",
    retryable: false,
  },

  // Rate limiting
  RATE_LIMITED: {
    title: "Too Many Requests",
    message:
      "You've made too many requests. Please wait a moment before trying again.",
    suggestion: "Wait a few minutes and try again.",
    retryable: true,
  },

  // Generic errors
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    suggestion:
      "Try refreshing the page or contact support if the problem persists.",
    retryable: true,
  },
};

/**
 * Parse error response and return user-friendly error details
 */
export const parseError = (error) => {
  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          ...ERROR_MESSAGES.UNKNOWN_ERROR,
          title: "Invalid Request",
          message:
            data?.message ||
            "The request was invalid. Please check your input and try again.",
          suggestion: "Review your request and try again.",
          retryable: false,
        };

      case 401:
        return {
          ...ERROR_MESSAGES.AUTH_EXPIRED,
          message:
            data?.message ||
            "Your session has expired. Please reconnect your accounts.",
          suggestion:
            "Go back to the transfer page and reconnect your platforms.",
        };

      case 403:
        return {
          ...ERROR_MESSAGES.AUTH_DENIED,
          message:
            data?.message ||
            "Access denied. You may not have permission to perform this action.",
          suggestion: "Check your account permissions and try again.",
        };

      case 404:
        return {
          ...ERROR_MESSAGES.PLAYLIST_NOT_FOUND,
          message: data?.message || "The requested resource was not found.",
          suggestion: "Check if the resource still exists and try again.",
        };

      case 429:
        return {
          ...ERROR_MESSAGES.RATE_LIMITED,
          message:
            data?.message ||
            "Too many requests. Please wait before trying again.",
          suggestion: "Wait a few minutes and try again.",
        };

      case 500:
        return {
          ...ERROR_MESSAGES.UNKNOWN_ERROR,
          title: "Server Error",
          message:
            "The server encountered an error. This is usually temporary.",
          suggestion:
            "Try again in a few minutes. If the problem persists, contact support.",
        };

      case 502:
      case 503:
      case 504:
        return {
          ...ERROR_MESSAGES.NETWORK_ERROR,
          title: "Service Unavailable",
          message:
            "The service is temporarily unavailable. Please try again later.",
          suggestion: "Try again in a few minutes.",
        };

      default:
        return {
          ...ERROR_MESSAGES.UNKNOWN_ERROR,
          title: `Error ${status}`,
          message:
            data?.message || "An error occurred while processing your request.",
          suggestion: "Try again or contact support if the problem persists.",
        };
    }
  }

  // Handle network errors
  if (error.request) {
    if (error.code === "ECONNABORTED") {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Handle other errors
  if (error.message) {
    // Check for specific error messages
    const lowerMessage = error.message.toLowerCase();

    if (lowerMessage.includes("spotify")) {
      return ERROR_MESSAGES.SPOTIFY_ERROR;
    }

    if (lowerMessage.includes("youtube") || lowerMessage.includes("google")) {
      return ERROR_MESSAGES.YOUTUBE_ERROR;
    }

    if (lowerMessage.includes("transfer")) {
      return ERROR_MESSAGES.TRANSFER_FAILED;
    }

    if (lowerMessage.includes("auth") || lowerMessage.includes("token")) {
      return ERROR_MESSAGES.AUTH_EXPIRED;
    }
  }

  // Default error
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Show error toast with retry option if applicable
 * Note: This function should be called from a React component context
 */
export const showErrorToast = (error, onRetry = null) => {
  const errorDetails = parseError(error);

  if (window.showToast) {
    // Create retry button element if retry function is provided
    let action = null;
    if (errorDetails.retryable && onRetry) {
      action = {
        type: "button",
        text: "Try Again",
        onClick: onRetry,
      };
    }

    window.showToast.error(errorDetails.title, errorDetails.message, {
      duration: 8000,
      action,
    });
  }

  return errorDetails;
};

/**
 * Handle errors with automatic retry logic
 */
export const handleErrorWithRetry = async (
  operation,
  maxRetries = 3,
  delay = 1000,
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorDetails = parseError(error);

      // Don't retry if error is not retryable
      if (!errorDetails.retryable) {
        throw error;
      }

      // Show retry attempt toast
      if (window.showToast && attempt < maxRetries) {
        window.showToast.warning(
          "Retrying...",
          `Attempt ${attempt} of ${maxRetries}. ${errorDetails.suggestion}`,
          { duration: 2000 },
        );
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // All retries failed
  throw lastError;
};

/**
 * Log error for debugging (development only)
 */
export const logError = (error, context = "") => {
  if (process.env.NODE_ENV === "development") {
    console.group(`🚨 Error${context ? ` in ${context}` : ""}`);
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    console.groupEnd();
  }
};
