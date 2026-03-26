const axios = require("axios");

/**
 * Enhanced API Service with Retry Logic and Circuit Breaker
 * Provides robust external API communication with automatic retries
 */

class ApiService {
  constructor() {
    this.circuitBreaker = {
      spotify: { failures: 0, lastFailure: 0, state: "CLOSED" },
      youtube: { failures: 0, lastFailure: 0, state: "CLOSED" },
    };

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2,
    };
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateDelay(attempt) {
    const delay =
      this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitOpen(platform) {
    const breaker = this.circuitBreaker[platform];
    if (breaker.state === "OPEN") {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      // Reset circuit after 10 seconds (was 30) for faster recovery
      if (timeSinceLastFailure > 10000) {
        breaker.state = "HALF_OPEN";
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record failure for circuit breaker
   */
  recordFailure(platform) {
    const breaker = this.circuitBreaker[platform];
    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Open circuit after 10 consecutive failures (was 5) to be less aggressive
    if (breaker.failures >= 10) {
      breaker.state = "OPEN";
      console.log(
        `🌐 ApiService: Circuit breaker opened for ${platform} after ${breaker.failures} failures`,
      );
    }
  }

  /**
   * Record success for circuit breaker
   */
  recordSuccess(platform) {
    const breaker = this.circuitBreaker[platform];
    if (breaker.failures > 0) {
      console.log(
        `🌐 ApiService: Circuit breaker reset for ${platform} after success`,
      );
    }
    breaker.failures = 0;
    breaker.state = "CLOSED";
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(config, platform = "general") {
    if (platform !== "general" && this.isCircuitOpen(platform)) {
      throw new Error(
        `Circuit breaker is open for ${platform}. Please try again later.`,
      );
    }

    console.log(
      `🌐 ApiService: Making ${config.method?.toUpperCase() || "GET"} request to ${platform}:`,
      {
        url: config.url,
        method: config.method,
        hasAuth: !!config.headers?.Authorization,
        hasParams: !!config.params,
        platform,
      },
    );

    let lastError;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `🌐 ApiService: Retry attempt ${attempt + 1} for ${platform}`,
          );
        }

        const response = await axios(config);

        console.log(`🌐 ApiService: ✅ Request successful for ${platform}:`, {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataType: typeof response.data,
          itemCount: response.data?.items?.length || "N/A",
        });

        if (platform !== "general") {
          this.recordSuccess(platform);
        }

        return response;
      } catch (error) {
        lastError = error;

        console.log(
          `🌐 ApiService: ❌ Request failed for ${platform} (attempt ${attempt + 1}):`,
          {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            url: config.url,
          },
        );

        // Don't retry on client errors (4xx) except rate limiting
        if (
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          if (error.response.status === 429) {
            // Rate limiting - wait and retry
            const retryAfter =
              error.response.headers["retry-after"] ||
              this.calculateDelay(attempt);
            console.log(
              `🌐 ApiService: Rate limited, waiting ${retryAfter}ms before retry`,
            );
            await this.sleep(retryAfter * 1000);
            continue;
          }

          // For YouTube API, handle 403 (quota exceeded) with exponential backoff
          if (error.response.status === 403 && platform === "youtube") {
            const backoffDelay = this.calculateDelay(attempt) * 2; // Double delay for quota issues
            console.log(
              `🌐 ApiService: YouTube API quota exceeded (403), waiting ${backoffDelay}ms before retry`,
            );
            await this.sleep(backoffDelay);
            continue;
          }

          // Don't retry other 4xx errors
          break;
        }

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Wait before retry
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    if (platform !== "general") {
      this.recordFailure(platform);
    }

    throw lastError;
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make GET request with retry logic
   */
  async get(url, config = {}, platform = "general") {
    return this.makeRequest(
      {
        method: "GET",
        url,
        ...config,
      },
      platform,
    );
  }

  /**
   * Make POST request with retry logic
   */
  async post(url, data = null, config = {}, platform = "general") {
    return this.makeRequest(
      {
        method: "POST",
        url,
        data,
        ...config,
      },
      platform,
    );
  }

  /**
   * Reset circuit breaker for a platform
   */
  resetCircuitBreaker(platform) {
    if (this.circuitBreaker[platform]) {
      this.circuitBreaker[platform].failures = 0;
      this.circuitBreaker[platform].state = "CLOSED";
      this.circuitBreaker[platform].lastFailure = 0;
      console.log(
        `🌐 ApiService: Manually reset circuit breaker for ${platform}`,
      );
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(platform) {
    const breaker = this.circuitBreaker[platform];
    return {
      state: breaker.state,
      failures: breaker.failures,
      lastFailure: breaker.lastFailure,
      timeSinceLastFailure: Date.now() - breaker.lastFailure,
    };
  }
}

module.exports = new ApiService();
