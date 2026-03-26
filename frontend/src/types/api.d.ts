/**
 * TypeScript definitions for API structures
 */

// Standard API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T;
  meta?: ApiMeta;
  error?: ApiError;
}

// API Metadata (pagination, etc.)
export interface ApiMeta {
  pagination?: PaginationMeta;
  [key: string]: any;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// API Error Structure
export interface ApiError {
  statusCode: number;
  code?: string;
  details?: any;
}

// Common error codes
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "REQUEST_ERROR"
  | "UNKNOWN_ERROR";

// Validation error details
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// API request configuration
export interface ApiRequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

// Upload progress callback
export type UploadProgressCallback = (
  percentCompleted: number,
  progressEvent: any,
) => void;

// API client methods return types
export type ApiResponseData<T> = T extends ApiResponse<infer U> ? U : T;

// Common API endpoints
export interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    status: string;
    refresh: string;
  };
  playlists: {
    list: string;
    get: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
  };
  transfer: {
    create: string;
    get: (id: string) => string;
    status: (id: string) => string;
    cancel: (id: string) => string;
  };
}

// Environment configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
}
