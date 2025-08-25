/**
 * Input validation utilities
 * Provides comprehensive validation for all API inputs
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Validates file upload
 * @param {Object} file - Multer file object
 * @returns {Object} - Validation result
 */
function validateFileUpload(file) {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
  }
  
  // Check file extension
  const allowedExtensions = ['.ycd', '.txt', '.m3u', '.m3u8'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
  }
  
  // Check filename for security
  const filename = file.originalname;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Invalid filename containing path traversal characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates playlist name
 * @param {string} name - Playlist name
 * @returns {Object} - Validation result
 */
function validatePlaylistName(name) {
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
  
  // Check for invalid characters (basic security)
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(trimmedName)) {
    errors.push('Playlist name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedName
  };
}

/**
 * Validates Spotify authorization code
 * @param {string} code - Authorization code
 * @returns {Object} - Validation result
 */
function validateAuthCode(code) {
  const errors = [];
  
  if (!code || typeof code !== 'string') {
    errors.push('Authorization code is required');
    return { isValid: false, errors };
  }
  
  const trimmedCode = code.trim();
  
  if (trimmedCode.length === 0) {
    errors.push('Authorization code cannot be empty');
  }
  
  // Basic format check (Spotify auth codes are typically alphanumeric with some special chars)
  if (!/^[A-Za-z0-9_-]+$/.test(trimmedCode)) {
    errors.push('Invalid authorization code format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedCode
  };
}

/**
 * Validates track selection array
 * @param {Array} tracks - Array of track objects
 * @returns {Object} - Validation result
 */
function validateTrackSelection(tracks) {
  const errors = [];
  
  if (!Array.isArray(tracks)) {
    errors.push('Tracks must be an array');
    return { isValid: false, errors };
  }
  
  if (tracks.length === 0) {
    errors.push('At least one track must be selected');
  }
  
  if (tracks.length > 1000) {
    errors.push('Too many tracks selected (maximum 1000)');
  }
  
  // Validate each track object
  tracks.forEach((track, index) => {
    if (!track || typeof track !== 'object') {
      errors.push(`Track at index ${index} is invalid`);
      return;
    }
    
    if (!track.spotifyTrack || !track.spotifyTrack.uri) {
      errors.push(`Track at index ${index} is missing Spotify URI`);
    }
    
    if (!track.selected) {
      errors.push(`Track at index ${index} is not selected`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes string input to prevent XSS
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates environment configuration
 * @returns {Object} - Validation result
 */
function validateEnvironment() {
  const errors = [];
  const requiredVars = [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI'
  ];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Validate Spotify redirect URI format
  if (process.env.SPOTIFY_REDIRECT_URI) {
    try {
      new URL(process.env.SPOTIFY_REDIRECT_URI);
    } catch (error) {
      errors.push('SPOTIFY_REDIRECT_URI must be a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFileUpload,
  validatePlaylistName,
  validateAuthCode,
  validateTrackSelection,
  sanitizeString,
  validateEnvironment
};
