const express = require('express');
const cors = require('cors');
const multer = require('multer');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import custom utilities
const { 
  validateFileUpload, 
  validatePlaylistName, 
  validateAuthCode, 
  validateTrackSelection,
  validateEnvironment 
} = require('./utils/validation');
const { 
  APIError, 
  ValidationError, 
  SpotifyError, 
  errorMiddleware, 
  asyncHandler,
  withTimeout 
} = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment configuration on startup
const envValidation = validateEnvironment();
if (!envValidation.isValid) {
  console.error('❌ Environment validation failed:');
  envValidation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} ${req.method} ${req.path}`);
  next();
});

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Store tokens in memory (in production, use a database)
let accessToken = null;
let refreshToken = null;

// Helper function to parse YCD file
async function parseYCDFile(fileBuffer) {
  try {
    // Detect if the file contains Hebrew characters
    const content = fileBuffer.toString('utf8');
    const hasHebrew = /[\u0590-\u05FF]/.test(content);
    
    let fileContent;
    if (hasHebrew) {
      // Use iconv-lite to decode Hebrew text properly
      const iconv = require('iconv-lite');
      fileContent = iconv.decode(fileBuffer, 'win1255');
    } else {
      fileContent = content;
    }

    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    const tracks = [];

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const trackInfo = extractTrackInfoFromPath(line);
        if (trackInfo) {
          tracks.push(trackInfo);
        }
      }
    }

    return tracks;
  } catch (error) {
    console.error('Error parsing YCD file:', error);
    throw new Error('Failed to parse YCD file');
  }
}

// Helper function to extract track info from file path
function extractTrackInfoFromPath(filePath) {
  try {
    // Get the full path and extract components
    const pathParts = filePath.split(/[\/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    
    // Remove file extension from filename
    const nameWithoutExt = fileName.replace(/\.[^.]*$/, '');
    
    let artist = '';
    let title = '';
    
    console.log(`📁 Parsing: ${nameWithoutExt}`);
    
    // Enhanced parsing for complex file paths
    // Pattern 1: "Artist - Album - Track Number - Title"
    const complexPattern = /^(.+?)\s*-\s*(.+?)\s*-\s*\d+\s*-\s*(.+)$/;
    const complexMatch = nameWithoutExt.match(complexPattern);
    
    if (complexMatch) {
      artist = complexMatch[1].trim();
      title = complexMatch[3].trim();
      console.log(`✅ Complex pattern matched: "${artist}" - "${title}"`);
    } else {
      // Pattern 2: Simple "Artist - Title" 
      const simplePattern = /^(.+?)\s*-\s*(.+)$/;
      const simpleMatch = nameWithoutExt.match(simplePattern);
      
      if (simpleMatch) {
        artist = simpleMatch[1].trim();
        title = simpleMatch[2].trim();
        console.log(`✅ Simple pattern matched: "${artist}" - "${title}"`);
      } else {
        // Fallback: extract from path structure
        title = nameWithoutExt.trim();
        
        // Try to get artist from directory structure
        for (let i = pathParts.length - 3; i >= 0; i--) {
          const part = pathParts[i];
          if (part && part !== 'Music' && !part.match(/^[A-Z]:$/) && part.length > 1) {
            artist = part;
            break;
          }
        }
        console.log(`⚠️ Fallback: "${artist}" - "${title}"`);
      }
    }
    
    // Clean up common artifacts
    artist = cleanupString(artist);
    title = cleanupString(title);
    
    console.log(`🧹 After cleanup: "${artist}" - "${title}"`);
    
    return {
      artist: artist || 'Unknown Artist',
      title: title || nameWithoutExt,
      originalPath: filePath
    };
  } catch (error) {
    console.error('Error extracting track info:', error);
    return null;
  }
}

// Helper function to clean up strings
function cleanupString(str) {
  return str
    // Remove common prefixes/suffixes
    .replace(/^(The\s+|A\s+)/i, '')
    // Remove track numbers and common patterns
    .replace(/^\d+\s*[-.]?\s*/, '')
    // Remove file format indicators and featured artists in parentheses (but keep them for search)
    .replace(/\s*\([^)]*Single[^)]*\)\s*/gi, ' ')
    .replace(/\s*\([^)]*EP[^)]*\)\s*/gi, ' ')
    .replace(/\s*\([^)]*Album[^)]*\)\s*/gi, ' ')
    .replace(/\s*\([^)]*Version[^)]*\)\s*/gi, ' ')
    .replace(/\s*\([^)]*Edit[^)]*\)\s*/gi, ' ')
    // Clean up common file naming artifacts
    .replace(/\s*-\s*\d+\s*$/, '') // Remove trailing track numbers
    .replace(/\s*\.\w+$/, '') // Remove file extensions
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to calculate confidence score for track matching
function calculateConfidenceScore(originalArtist, originalTitle, spotifyTrack, searchStrategy) {
  if (!spotifyTrack) return 0;

  const spotifyArtists = spotifyTrack.artists.map(a => a.name).join(', ');
  const spotifyTitle = spotifyTrack.name;

  // Normalize strings for comparison
  const normalizeForComparison = (str) => {
    return str.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  };

  const origArtistNorm = normalizeForComparison(originalArtist);
  const origTitleNorm = normalizeForComparison(originalTitle);
  const spotArtistNorm = normalizeForComparison(spotifyArtists);
  const spotTitleNorm = normalizeForComparison(spotifyTitle);

  let confidence = 0;

  // Artist matching (40% of confidence)
  const artistSimilarity = calculateStringSimilarity(origArtistNorm, spotArtistNorm);
  confidence += artistSimilarity * 0.4;

  // Title matching (50% of confidence)
  const titleSimilarity = calculateStringSimilarity(origTitleNorm, spotTitleNorm);
  confidence += titleSimilarity * 0.5;

  // Search strategy bonus (10% of confidence)
  const strategyBonus = {
    'artist:track search': 0.1,      // Highest confidence - exact search
    'combined search': 0.08,         // High confidence
    'title search + artist matching': 0.06, // Medium confidence
    'title-only search (no artist match)': 0.02, // Lower confidence
    'cleaned search terms': 0.05     // Medium-low confidence
  };
  confidence += strategyBonus[searchStrategy] || 0;

  // Cap at 1.0 and convert to percentage
  return Math.min(Math.round(confidence * 100), 100);
}

// Helper function to calculate string similarity (Levenshtein-based)
function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  // Check for exact substring matches
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.9; // Very high similarity for substring matches
  }

  // Simple word-based similarity
  const words1 = str1.split(' ').filter(w => w.length > 0);
  const words2 = str2.split(' ').filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0.0;

  const matchingWords = words1.filter(word1 => 
    words2.some(word2 => 
      word1 === word2 || 
      word1.includes(word2) || 
      word2.includes(word1) ||
      (word1.length > 3 && word2.length > 3 && 
       (word1.startsWith(word2.substring(0, 3)) || word2.startsWith(word1.substring(0, 3))))
    )
  ).length;

  const similarity = matchingWords / Math.max(words1.length, words2.length);
  return similarity;
}

// Helper function to search for track on Spotify
async function searchSpotifyTrack(artist, title) {
  try {
    console.log(`🔍 Searching: "${artist}" - "${title}"`);
    
    // Strategy 1: Search with artist and title
    let query = `artist:${artist} track:${title}`;
    let response = await spotifyApi.searchTracks(query, { limit: 3 });
    
    if (response.body.tracks.items.length > 0) {
      console.log(`✅ Found with artist:track search`);
      return { track: response.body.tracks.items[0], strategy: 'artist:track search' };
    }
    
    // Strategy 2: Simple combined search
    query = `${artist} ${title}`;
    response = await spotifyApi.searchTracks(query, { limit: 3 });
    
    if (response.body.tracks.items.length > 0) {
      console.log(`✅ Found with combined search`);
      return { track: response.body.tracks.items[0], strategy: 'combined search' };
    }
    
    // Strategy 3: Search with just the title (broader search)
    response = await spotifyApi.searchTracks(title, { limit: 5 });
    
    if (response.body.tracks.items.length > 0) {
      // Try to find a match that includes the artist name
      for (const track of response.body.tracks.items) {
        const trackArtists = track.artists.map(a => a.name.toLowerCase()).join(' ');
        if (trackArtists.includes(artist.toLowerCase()) || 
            artist.toLowerCase().includes(trackArtists.split(' ')[0])) {
          console.log(`✅ Found with title search + artist matching`);
          return { track, strategy: 'title search + artist matching' };
        }
      }
      // If no artist match, return the first result
      console.log(`⚠️ Found with title-only search (no artist match)`);
      return { track: response.body.tracks.items[0], strategy: 'title-only search (no artist match)' };
    }
    
    // Strategy 4: Try with cleaned up search terms
    const cleanArtist = artist.replace(/[^\w\s]/g, '').trim();
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
    
    if (cleanArtist !== artist || cleanTitle !== title) {
      query = `${cleanArtist} ${cleanTitle}`;
      response = await spotifyApi.searchTracks(query, { limit: 3 });
      
      if (response.body.tracks.items.length > 0) {
        console.log(`✅ Found with cleaned search terms`);
        return { track: response.body.tracks.items[0], strategy: 'cleaned search terms' };
      }
    }
    
    console.log(`❌ No results found`);
    return null;
  } catch (error) {
    console.error('Error searching Spotify track:', error);
    return null;
  }
}

// Create API router
const apiRouter = express.Router();

// Get Spotify auth URL
apiRouter.get('/auth-url', (req, res) => {
  try {
    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email'
    ];
    
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.json({ authUrl: authorizeURL });
  } catch (error) {
    console.error('Error creating auth URL:', error);
    res.status(500).json({ error: 'Failed to create auth URL' });
  }
});

// Handle Spotify callback
apiRouter.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const data = await spotifyApi.authorizationCodeGrant(code);
    
    accessToken = data.body.access_token;
    refreshToken = data.body.refresh_token;
    
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    
    res.json({ 
      success: true, 
      accessToken,
      refreshToken,
      expiresIn: data.body.expires_in
    });
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

// Refresh access token
apiRouter.post('/refresh-token', async (req, res) => {
  try {
    if (!refreshToken) {
      return res.status(400).json({ error: 'No refresh token available' });
    }

    const data = await spotifyApi.refreshAccessToken();
    accessToken = data.body.access_token;
    
    spotifyApi.setAccessToken(accessToken);
    
    res.json({ 
      success: true, 
      accessToken,
      expiresIn: data.body.expires_in
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Upload and parse YCD file (without Spotify search initially)
apiRouter.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  // Validate file upload
  const fileValidation = validateFileUpload(req.file);
  if (!fileValidation.isValid) {
    throw new ValidationError('File validation failed', fileValidation.errors);
  }

  console.log(`📁 Processing file: ${req.file.originalname}`);
  
  // Parse the YCD file with timeout
  const parseWithTimeout = withTimeout(parseYCDFile, 30000, 'File parsing timed out');
  const tracks = await parseWithTimeout(req.file.buffer);
  
  if (!tracks || tracks.length === 0) {
    throw new APIError('No valid tracks found in file', 400, 'NO_TRACKS_FOUND');
  }
  
  console.log(`✅ Successfully parsed ${tracks.length} tracks`);
  
  // Return tracks without Spotify search initially
  const tracksWithoutSpotify = tracks.map(track => ({
    ...track,
    spotifyTrack: null,
    selected: false, // Will be set to true when Spotify track is found
    searchStatus: 'pending' // pending, searching, found, not_found
  }));
  
  res.json({ 
    success: true, 
    tracks: tracksWithoutSpotify,
    fileName: req.file.originalname,
    trackCount: tracks.length
  });
}));

// Search Spotify tracks for uploaded tracks
apiRouter.post('/search-tracks', async (req, res) => {
  try {
    const { tracks } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' });
    }

    if (!tracks || tracks.length === 0) {
      return res.status(400).json({ error: 'No tracks provided' });
    }

    // Set the access token for Spotify API
    spotifyApi.setAccessToken(accessToken);

    const tracksWithSpotify = [];
    const totalTracks = tracks.length;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      console.log(`🔍 Searching track ${i + 1}/${totalTracks}: ${track.artist} - ${track.title}`);

      const searchResult = await searchSpotifyTrack(track.artist, track.title);
      const spotifyTrack = searchResult?.track;
      const searchStrategy = searchResult?.strategy;

      // Calculate confidence score
      const confidence = spotifyTrack ? 
        calculateConfidenceScore(track.artist, track.title, spotifyTrack, searchStrategy) : 0;

      console.log(`📊 Confidence: ${confidence}% (${searchStrategy || 'no match'})`);

      tracksWithSpotify.push({
        ...track,
        spotifyTrack: spotifyTrack ? {
          id: spotifyTrack.id,
          name: spotifyTrack.name,
          artists: spotifyTrack.artists.map(a => a.name).join(', '),
          album: spotifyTrack.album.name,
          uri: spotifyTrack.uri,
          external_url: spotifyTrack.external_urls.spotify,
          duration_ms: spotifyTrack.duration_ms
        } : null,
        selected: spotifyTrack !== null, // Auto-select if found on Spotify
        searchStatus: spotifyTrack ? 'found' : 'not_found',
        confidence: confidence,
        searchStrategy: searchStrategy || 'no match'
      });

      // Add a small delay to prevent rate limiting
      if (i < tracks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Completed searching all ${totalTracks} tracks`);

    res.json({
      success: true,
      tracks: tracksWithSpotify
    });
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Create Spotify playlist
apiRouter.post('/create-playlist', async (req, res) => {
  try {
    const { playlistName, tracks } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' });
    }
    
    if (!playlistName || !tracks || tracks.length === 0) {
      return res.status(400).json({ error: 'Playlist name and tracks are required' });
    }

    // Get user ID
    const me = await spotifyApi.getMe();
    const userId = me.body.id;

    // Create playlist
    const playlist = await spotifyApi.createPlaylist(userId, {
      name: playlistName,
      description: `Created with YCD Alchemist by Ofer Bachner`,
      public: true
    });

    // Add selected tracks to playlist
    const trackUris = [];
    let tracksAdded = 0;
    
    for (const track of tracks) {
      if (track.selected && track.spotifyTrack) {
        trackUris.push(track.spotifyTrack.uri);
        tracksAdded++;
      }
    }

    // Add tracks to playlist in batches of 100
    if (trackUris.length > 0) {
      for (let i = 0; i < trackUris.length; i += 100) {
        const batch = trackUris.slice(i, i + 100);
        await spotifyApi.addTracksToPlaylist(playlist.body.id, batch);
      }
    }

    res.json({
      success: true,
      playlist: {
        id: playlist.body.id,
        name: playlist.body.name,
        playlistUrl: playlist.body.external_urls.spotify,
        tracksAdded,
        totalTracks: tracks.filter(t => t.selected).length
      }
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    
    // Extract detailed error message
    let errorMessage = 'Failed to create playlist';
    if (error.body && error.body.error) {
      errorMessage = error.body.error.message || error.body.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount API router
app.use('/api', apiRouter);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Global error handling middleware (must be last)
app.use(errorMiddleware);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 YCD Alchemist Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});
