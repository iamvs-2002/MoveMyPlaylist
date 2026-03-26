const crypto = require("crypto");

/**
 * Crypto utilities for MoveMyPlaylist
 * Handles secure random string generation and other cryptographic operations
 */

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the string to generate
 * @returns {string} Random string
 */
const generateRandomString = (length) => {
  if (typeof length !== "number" || length <= 0) {
    throw new Error("Length must be a positive number");
  }

  return crypto.randomBytes(length).toString("hex").substring(0, length);
};

/**
 * Generate a secure state parameter for OAuth flows
 * @returns {string} 32-character random string
 */
const generateOAuthState = () => {
  return generateRandomString(32);
};

/**
 * Hash a string using SHA-256
 * @param {string} input - String to hash
 * @returns {string} Hexadecimal hash
 */
const hashString = (input) => {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return crypto.createHash("sha256").update(input).digest("hex");
};

/**
 * Generate a secure nonce for API requests
 * @returns {string} Random nonce
 */
const generateNonce = () => {
  return generateRandomString(16);
};

/**
 * Verify if a string matches a hash
 * @param {string} input - Original string
 * @param {string} hash - Hash to verify against
 * @returns {boolean} True if match, false otherwise
 */
const verifyHash = (input, hash) => {
  if (typeof input !== "string" || typeof hash !== "string") {
    throw new Error("Both input and hash must be strings");
  }

  return hashString(input) === hash;
};

module.exports = {
  generateRandomString,
  generateOAuthState,
  hashString,
  generateNonce,
  verifyHash,
};
