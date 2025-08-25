/**
 * Application constants
 * Centralized configuration and constants
 */

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';
export const API_TIMEOUT = 30000; // 30 seconds

// File Upload Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.ycd', '.txt', '.m3u', '.m3u8'];
export const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'audio/x-mpegurl',
  'audio/mpegurl',
  'application/vnd.apple.mpegurl'
];

// Playlist Configuration
export const MAX_PLAYLIST_NAME_LENGTH = 100;
export const MAX_TRACKS_PER_PLAYLIST = 1000;
export const MIN_PLAYLIST_NAME_LENGTH = 1;

// Search Configuration
export const SEARCH_DEBOUNCE_DELAY = 300;
export const MAX_SEARCH_RETRIES = 3;
export const SEARCH_TIMEOUT = 10000; // 10 seconds per search

// UI Configuration
export const TOAST_DURATION = 4000;
export const PROGRESS_UPDATE_INTERVAL = 100;

// Local Storage Keys
export const STORAGE_KEYS = {
  SPOTIFY_ACCESS_TOKEN: 'spotify_access_token',
  SPOTIFY_REFRESH_TOKEN: 'spotify_refresh_token',
  SPOTIFY_TOKEN_EXPIRY: 'spotify_token_expiry',
  UPLOADED_TRACKS: 'uploaded_tracks',
  PLAYLIST_NAME: 'playlist_name'
};

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
  INVALID_FILE_TYPE: `Invalid file type. Supported types: ${ALLOWED_FILE_TYPES.join(', ')}`,
  NO_FILE_SELECTED: 'Please select a file to upload',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  SEARCH_FAILED: 'Failed to search Spotify tracks. Please try again.',
  PLAYLIST_CREATION_FAILED: 'Failed to create playlist. Please try again.',
  SPOTIFY_AUTH_FAILED: 'Spotify authentication failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  INVALID_PLAYLIST_NAME: 'Please enter a valid playlist name'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully!',
  TRACKS_SEARCHED: 'Spotify search completed!',
  PLAYLIST_CREATED: 'Playlist created successfully!',
  SPOTIFY_CONNECTED: 'Connected to Spotify!'
};

// Confidence Score Configuration
export const CONFIDENCE_LEVELS = {
  EXCELLENT: { min: 90, label: 'Excellent', color: 'text-emerald-600' },
  VERY_GOOD: { min: 75, label: 'Very Good', color: 'text-green-600' },
  GOOD: { min: 60, label: 'Good', color: 'text-yellow-600' },
  FAIR: { min: 40, label: 'Fair', color: 'text-orange-600' },
  POOR: { min: 0, label: 'Poor', color: 'text-red-600' }
};

// Track Status
export const TRACK_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching',
  FOUND: 'found',
  NOT_FOUND: 'not_found'
};

// Application Metadata
export const APP_INFO = {
  NAME: 'YCD Alchemist',
  VERSION: '1.0.0',
  AUTHOR: 'Ofer Bachner',
  DESCRIPTION: '🧪 Transform YCD files into Spotify playlists with alchemical magic!'
};
