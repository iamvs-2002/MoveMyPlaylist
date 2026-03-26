/**
 * Example usage of the client-side API utilities
 * This file demonstrates how to implement consistent API calls and error handling
 */

import {
  get,
  post,
  put,
  del,
  patch,
  upload,
  setAuthToken,
  clearAuthToken,
  ApiError,
} from "../utils/api";

/**
 * Example 1: Basic API calls
 */
export const apiExamples = {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = await get(`/api/users/${userId}`);
      return user;
    } catch (error) {
      if (error.code === "NOT_FOUND") {
        console.log("User not found");
        return null;
      }
      throw error;
    }
  },

  // Create a new playlist
  async createPlaylist(playlistData) {
    try {
      const playlist = await post("/api/playlists", playlistData);
      return playlist;
    } catch (error) {
      if (error.code === "VALIDATION_ERROR") {
        console.log("Validation errors:", error.details?.validationErrors);
        throw error;
      }
      throw error;
    }
  },

  // Update playlist
  async updatePlaylist(playlistId, updates) {
    try {
      const playlist = await put(`/api/playlists/${playlistId}`, updates);
      return playlist;
    } catch (error) {
      if (error.code === "FORBIDDEN") {
        console.log("You do not have permission to update this playlist");
      }
      throw error;
    }
  },

  // Delete playlist
  async deletePlaylist(playlistId) {
    try {
      await del(`/api/playlists/${playlistId}`);
      return true;
    } catch (error) {
      if (error.code === "NOT_FOUND") {
        console.log("Playlist already deleted or not found");
        return false;
      }
      throw error;
    }
  },
};

/**
 * Example 2: Authentication handling
 */
export const authExamples = {
  // Login user
  async login(credentials) {
    try {
      const response = await post("/auth/login", credentials);

      // Set auth token for subsequent requests
      if (response.token) {
        setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      if (error.code === "UNAUTHORIZED") {
        console.log("Invalid credentials");
      }
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await post("/auth/logout");
    } catch (error) {
      console.log("Logout error:", error.message);
    } finally {
      // Always clear the token locally
      clearAuthToken();
    }
  },

  // Check auth status
  async checkAuthStatus() {
    try {
      const status = await get("/auth/status");
      return status;
    } catch (error) {
      if (error.code === "UNAUTHORIZED") {
        clearAuthToken();
        return { isAuthenticated: false };
      }
      throw error;
    }
  },
};

/**
 * Example 3: File upload with progress
 */
export const uploadExamples = {
  // Upload playlist file
  async uploadPlaylistFile(file, onProgress) {
    try {
      const formData = new FormData();
      formData.append("playlist", file);
      formData.append("type", "m3u");

      const result = await upload(
        "/api/playlists/upload",
        formData,
        onProgress,
      );
      return result;
    } catch (error) {
      if (error.code === "VALIDATION_ERROR") {
        console.log("File validation failed:", error.details);
      }
      throw error;
    }
  },

  // Upload multiple files
  async uploadMultipleFiles(files, onProgress) {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      const result = await upload("/api/files/upload", formData, onProgress);
      return result;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Example 4: Error handling patterns
 */
export const errorHandlingExamples = {
  // Generic error handler
  handleApiError(error, context = "") {
    if (error.isApiError) {
      switch (error.code) {
        case "UNAUTHORIZED":
          // Redirect to login
          window.location.href = "/login";
          break;
        case "FORBIDDEN":
          // Show access denied message
          console.log("Access denied:", error.message);
          break;
        case "VALIDATION_ERROR":
          // Handle validation errors
          console.log("Validation errors:", error.details);
          break;
        case "NOT_FOUND":
          // Handle not found
          console.log("Resource not found:", error.message);
          break;
        case "RATE_LIMIT_EXCEEDED":
          // Handle rate limiting
          console.log(
            "Rate limit exceeded, retry after:",
            error.details?.retryAfter,
          );
          break;
        default:
          // Generic error handling
          console.log(`API Error (${error.code}):`, error.message);
      }
    } else {
      // Non-API error
      console.log("Unexpected error:", error.message);
    }
  },

  // Retry mechanism for failed requests
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        if (error.code === "RATE_LIMIT_EXCEEDED") {
          const retryAfter = error.details?.retryAfter || delay;
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }
  },
};

/**
 * Example 5: Advanced usage patterns
 */
export const advancedExamples = {
  // Batch operations
  async batchDeletePlaylists(playlistIds) {
    try {
      const promises = playlistIds.map((id) =>
        del(`/api/playlists/${id}`).catch((error) => ({
          id,
          error: error.message,
          success: false,
        })),
      );

      const results = await Promise.allSettled(promises);
      return results.map((result, index) => ({
        id: playlistIds[index],
        success: result.status === "fulfilled",
        ...(result.status === "fulfilled"
          ? { data: result.value }
          : { error: result.reason }),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Conditional requests
  async getPlaylistIfModified(playlistId, lastModified) {
    try {
      const headers = {};
      if (lastModified) {
        headers["If-Modified-Since"] = new Date(lastModified).toUTCString();
      }

      const playlist = await get(`/api/playlists/${playlistId}`, { headers });
      return playlist;
    } catch (error) {
      if (error.statusCode === 304) {
        return null; // Not modified
      }
      throw error;
    }
  },

  // Search with pagination
  async searchPlaylists(query, page = 1, limit = 10) {
    try {
      const params = { q: query, page, limit };
      const playlists = await get("/api/playlists/search", { params });
      return playlists;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Example 6: React Hook usage
 */
export const useApiExamples = {
  // Custom hook for API calls with loading state
  useApiCall(apiFunction, dependencies = []) {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const execute = React.useCallback(async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    }, dependencies);

    return { data, loading, error, execute };
  },

  // Custom hook for paginated data
  usePaginatedApi(apiFunction, initialPage = 1, pageSize = 10) {
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [pagination, setPagination] = React.useState({
      page: initialPage,
      limit: pageSize,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });

    const fetchPage = React.useCallback(
      async (page = initialPage) => {
        setLoading(true);
        setError(null);

        try {
          const result = await apiFunction(page, pageSize);
          setData(result.data || result);

          if (result.meta?.pagination) {
            setPagination(result.meta.pagination);
          }

          return result;
        } catch (err) {
          setError(err);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [apiFunction, pageSize],
    );

    const nextPage = React.useCallback(() => {
      if (pagination.hasNextPage) {
        return fetchPage(pagination.nextPage);
      }
    }, [pagination.hasNextPage, pagination.nextPage, fetchPage]);

    const prevPage = React.useCallback(() => {
      if (pagination.hasPrevPage) {
        return fetchPage(pagination.prevPage);
      }
    }, [pagination.hasPrevPage, pagination.prevPage, fetchPage]);

    return {
      data,
      loading,
      error,
      pagination,
      fetchPage,
      nextPage,
      prevPage,
    };
  },
};

// Export all examples
export default {
  apiExamples,
  authExamples,
  uploadExamples,
  errorHandlingExamples,
  advancedExamples,
  useApiExamples,
};
