/**
 * Helper utility functions
 * Reusable utility functions for the application
 */

import { CONFIDENCE_LEVELS, STORAGE_KEYS, ERROR_MESSAGES } from './constants';

/**
 * Formats duration from milliseconds to MM:SS format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
export const formatDuration = (ms) => {
  if (!ms || typeof ms !== 'number') return '0:00';
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Gets confidence level color class based on score
 * @param {number} confidence - Confidence score (0-100)
 * @returns {string} - Tailwind CSS color class
 */
export const getConfidenceColor = (confidence) => {
  if (typeof confidence !== 'number') return CONFIDENCE_LEVELS.POOR.color;
  
  for (const level of Object.values(CONFIDENCE_LEVELS)) {
    if (confidence >= level.min) {
      return level.color;
    }
  }
  return CONFIDENCE_LEVELS.POOR.color;
};

/**
 * Gets confidence level label based on score
 * @param {number} confidence - Confidence score (0-100)
 * @returns {string} - Confidence level label
 */
export const getConfidenceLabel = (confidence) => {
  if (typeof confidence !== 'number') return CONFIDENCE_LEVELS.POOR.label;
  
  for (const level of Object.values(CONFIDENCE_LEVELS)) {
    if (confidence >= level.min) {
      return level.label;
    }
  }
  return CONFIDENCE_LEVELS.POOR.label;
};

/**
 * Validates file before upload
 * @param {File} file - File object
 * @returns {Object} - Validation result
 */
export const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push(ERROR_MESSAGES.NO_FILE_SELECTED);
    return { isValid: false, errors };
  }
  
  // Check file size
  if (file.size > 10 * 1024 * 1024) { // 10MB
    errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
  }
  
  // Check file extension
  const allowedExtensions = ['.ycd', '.txt', '.m3u', '.m3u8'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates playlist name
 * @param {string} name - Playlist name
 * @returns {Object} - Validation result
 */
export const validatePlaylistName = (name) => {
  const errors = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Playlist name is required');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    errors.push('Playlist name cannot be empty');
  }
  
  if (trimmedName.length > 100) {
    errors.push('Playlist name cannot exceed 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedName
  };
};

/**
 * Safely gets item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} - Stored value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely sets item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set localStorage item "${key}":`, error);
  }
};

/**
 * Safely removes item from localStorage
 * @param {string} key - Storage key
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error);
  }
};

/**
 * Clears all app-related localStorage items
 */
export const clearAppStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key);
  });
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Creates a delay promise
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} - Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculates confidence distribution from tracks
 * @param {Array} tracks - Array of track objects
 * @returns {Object} - Confidence distribution
 */
export const calculateConfidenceDistribution = (tracks) => {
  const distribution = {
    excellent: 0,
    veryGood: 0,
    good: 0,
    fair: 0,
    poor: 0
  };
  
  tracks.forEach(track => {
    if (track.confidence !== undefined) {
      const confidence = track.confidence;
      if (confidence >= 90) distribution.excellent++;
      else if (confidence >= 75) distribution.veryGood++;
      else if (confidence >= 60) distribution.good++;
      else if (confidence >= 40) distribution.fair++;
      else distribution.poor++;
    }
  });
  
  return distribution;
};

/**
 * Calculates average confidence from tracks
 * @param {Array} tracks - Array of track objects
 * @returns {number} - Average confidence score
 */
export const calculateAverageConfidence = (tracks) => {
  const tracksWithConfidence = tracks.filter(t => t.confidence !== undefined);
  if (tracksWithConfidence.length === 0) return 0;
  
  const sum = tracksWithConfidence.reduce((acc, track) => acc + track.confidence, 0);
  return Math.round(sum / tracksWithConfidence.length);
};

/**
 * Sanitizes filename for display
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'Unknown';
  
  // Remove file extension and clean up
  return filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Formats error message for display
 * @param {Error|string} error - Error object or message
 * @returns {string} - Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error && error.message) {
    // Handle API errors with custom messages
    if (error.response && error.response.data && error.response.data.error) {
      return error.response.data.error.message || error.response.data.error;
    }
    return error.message;
  }
  
  return ERROR_MESSAGES.NETWORK_ERROR;
};
