import React, { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import Header from './components/layout/Header';
import FileUpload from './components/features/FileUpload';
import TrackList from './components/features/TrackList';
import PlaylistCreator from './components/features/PlaylistCreator';
import PlaylistSuccess from './components/features/PlaylistSuccess';
import './styles/components.css';
import './App.css';

function App() {
  // State management
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [spotifyToken, setSpotifyToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [playlistCreated, setPlaylistCreated] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0, isSearching: false });

  // Load saved authentication state from localStorage
  const loadSavedAuthState = useCallback(() => {
    try {
      const savedToken = localStorage.getItem('spotify_access_token');
      const savedRefreshToken = localStorage.getItem('spotify_refresh_token');
      const savedTokenExpiry = localStorage.getItem('spotify_token_expiry');
      
      // Also load saved tracks and playlist name
      const savedTracks = localStorage.getItem('uploaded_tracks');
      const savedPlaylistName = localStorage.getItem('playlist_name');
      
      if (savedToken && savedRefreshToken && savedTokenExpiry) {
        const expiryTime = parseInt(savedTokenExpiry);
        
        // Check if token is still valid (with 5 minute buffer)
        if (Date.now() < expiryTime - (5 * 60 * 1000)) {
          console.log('🔄 Loading saved authentication state');
          setSpotifyToken(savedToken);
          setRefreshToken(savedRefreshToken);
          setTokenExpiry(expiryTime);
          
          // Load saved tracks and playlist name
          if (savedTracks) {
            console.log('📁 Loading saved tracks');
            setTracks(JSON.parse(savedTracks));
          }
          
          if (savedPlaylistName) {
            console.log('📝 Loading saved playlist name');
            setPlaylistName(savedPlaylistName);
          }
          
          toast.success('Welcome back! Your session has been restored.');
        } else {
          console.log('Token expired, clearing saved state');
          localStorage.removeItem('spotify_access_token');
          localStorage.removeItem('spotify_refresh_token');
          localStorage.removeItem('spotify_token_expiry');
          localStorage.removeItem('uploaded_tracks');
          localStorage.removeItem('playlist_name');
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expiry');
      localStorage.removeItem('uploaded_tracks');
      localStorage.removeItem('playlist_name');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Save authentication state to localStorage
  const saveAuthState = useCallback((token, refresh, expiry) => {
    try {
      localStorage.setItem('spotify_access_token', token);
      localStorage.setItem('spotify_refresh_token', refresh);
      localStorage.setItem('spotify_token_expiry', expiry.toString());
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }, []);

  // Clear saved authentication state
  const clearSavedAuthState = useCallback(() => {
    try {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expiry');
      localStorage.removeItem('uploaded_tracks');
      localStorage.removeItem('playlist_name');
      console.log('🗑️ Saved authentication state cleared');
    } catch (error) {
      console.error('Error clearing saved state:', error);
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }

    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await axios.post('/api/refresh-token', {
        refreshToken
      });

      if (response.data.success) {
        const newToken = response.data.accessToken;
        const newExpiry = Date.now() + (response.data.expiresIn * 1000);
        
        setSpotifyToken(newToken);
        setTokenExpiry(newExpiry);
        
        // Save refreshed token
        saveAuthState(newToken, refreshToken, newExpiry);
        
        console.log('✅ Token refreshed successfully');
        return newToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      clearSavedAuthState();
      setSpotifyToken('');
      setRefreshToken('');
      setTokenExpiry(null);
      toast.error('Please reconnect to Spotify');
      return null;
    }
  }, [refreshToken, saveAuthState, clearSavedAuthState]);

  // Handle Spotify authentication
  const handleSpotifyAuth = async () => {
    try {
      const response = await axios.get('/api/auth-url');
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast.error('Failed to connect to Spotify');
    }
  };

  // Handle Spotify disconnect
  const handleSpotifyDisconnect = useCallback(() => {
    setSpotifyToken('');
    setRefreshToken('');
    setTokenExpiry(null);
    setTracks([]);
    setPlaylistName('');
    setPlaylistCreated(null);
    
    // Clear saved authentication state
    clearSavedAuthState();
    
    toast.success('Disconnected from Spotify');
  }, [clearSavedAuthState]);

  // Handle Spotify OAuth callback
  const handleSpotifyCallback = useCallback(async (code) => {
    try {
      console.log('🔄 Handling Spotify callback with code:', code);
      
      const response = await axios.post('/api/callback', { code });

      if (response.data.success) {
        console.log('✅ Spotify authentication successful');
        
        setSpotifyToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        setTokenExpiry(Date.now() + (response.data.expiresIn * 1000));
        
        // Save to localStorage
        saveAuthState(
          response.data.accessToken,
          response.data.refreshToken,
          Date.now() + (response.data.expiresIn * 1000)
        );
        
        toast.success('Successfully connected to Spotify!');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('❌ Callback error:', error);
      toast.error('Failed to complete Spotify authentication');
    }
  }, [saveAuthState]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    setLoading(true);
    
    try {
      console.log('📁 Uploading file:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const extractedTracks = response.data.tracks;
        const fileName = response.data.fileName;
        
        console.log('✅ File processed successfully');
        console.log('📊 Extracted tracks:', extractedTracks.length);
        
        setTracks(extractedTracks);
        
        // Auto-populate playlist name with file name (without extension)
        const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
        setPlaylistName(nameWithoutExtension);
        
        // Save to localStorage
        localStorage.setItem('uploaded_tracks', JSON.stringify(extractedTracks));
        localStorage.setItem('playlist_name', nameWithoutExtension);
        
        toast.success(`Successfully processed ${extractedTracks.length} tracks!`);
      } else {
        throw new Error('File processing failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error('Failed to process file. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); // spotifyToken is accessed directly within the function

  // Search Spotify tracks with progress tracking
  const searchSpotifyTracks = useCallback(async (tracksToSearch) => {
    if (!spotifyToken || !tracksToSearch || tracksToSearch.length === 0) {
      return tracksToSearch;
    }

    setSearchProgress({ current: 0, total: tracksToSearch.length, isSearching: true });
    
    let progressInterval;
    
    try {
      console.log('🔍 Starting Spotify track search...');
      
      // Start realistic progress simulation
      // Each track takes about 200-300ms (100ms search + 100ms delay + overhead)
      const estimatedTimePerTrack = 250; // milliseconds
      const updateInterval = Math.max(100, estimatedTimePerTrack / 3); // Update 3 times per track
      
      progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev.isSearching && prev.current < prev.total) {
            // Increment progress more slowly and realistically
            const increment = Math.random() > 0.7 ? 1 : 0; // Sometimes skip updates for realism
            return { 
              ...prev, 
              current: Math.min(prev.current + increment, prev.total - 1) // Never complete until actual response
            };
          }
          return prev;
        });
      }, updateInterval);
      
      const response = await axios.post('/api/search-tracks', {
        tracks: tracksToSearch
      });

      // Clear the progress interval immediately when response arrives
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (response.data.success) {
        const searchedTracks = response.data.tracks;
        console.log('✅ Spotify search completed');
        
        // Set final progress - search completed
        setSearchProgress({ current: tracksToSearch.length, total: tracksToSearch.length, isSearching: false });
        
        setTracks(searchedTracks);
        localStorage.setItem('uploaded_tracks', JSON.stringify(searchedTracks));
        
        const foundCount = searchedTracks.filter(t => t.spotifyTrack).length;
        toast.success(`Found ${foundCount} of ${searchedTracks.length} tracks on Spotify!`);
        
        return searchedTracks;
      } else {
        throw new Error('Track search failed');
      }
    } catch (error) {
      console.error('❌ Track search error:', error);
      
      // Clear progress interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      let errorMessage = 'Failed to search tracks on Spotify';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return tracksToSearch; // Return original tracks if search fails
    } finally {
      // Ensure progress is reset
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Only reset if still searching (don't override successful completion)
      setSearchProgress(prev => 
        prev.isSearching ? { current: 0, total: 0, isSearching: false } : prev
      );
    }
  }, [spotifyToken]);

  // Handle track selection changes
  const handleTrackSelectionChange = useCallback((index) => {
    setTracks(prevTracks => {
      const newTracks = [...prevTracks];
      newTracks[index] = {
        ...newTracks[index],
        selected: !newTracks[index].selected
      };
      return newTracks;
    });
  }, []);

  // Create Spotify playlist
  const createSpotifyPlaylist = useCallback(async () => {
    if (!spotifyToken || !playlistName || tracks.length === 0) {
      toast.error('Please connect to Spotify, enter a playlist name, and upload tracks');
      return;
    }

    const selectedTracks = tracks.filter(track => track.selected);
    if (selectedTracks.length === 0) {
      toast.error('Please select at least one track to add to the playlist');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🎵 Creating Spotify playlist...');
      console.log('📝 Playlist name:', playlistName);
      console.log('📊 Tracks to add:', tracks.length);
      
      const response = await axios.post('/api/create-playlist', {
        playlistName,
        tracks: selectedTracks
      });

      if (response.data.success) {
        const playlist = response.data.playlist;
        
        console.log('✅ Playlist created successfully!');
        console.log('🔗 Playlist URL:', playlist.playlistUrl);
        console.log('📊 Tracks added:', playlist.tracksAdded, 'of', playlist.totalTracks);
        
        setPlaylistCreated(playlist);
        
        // Save playlist name to localStorage
        localStorage.setItem('playlist_name', playlistName);
        
        toast.success(`Playlist created! ${playlist.tracksAdded} tracks added.`);
        
        // Auto-redirect to playlist after 2 seconds
        setTimeout(() => {
          window.open(playlist.playlistUrl, '_blank');
        }, 2000);
      } else {
        throw new Error('Playlist creation failed');
      }
    } catch (error) {
      console.error('❌ Playlist creation error:', error);
      
      let errorMessage = 'Failed to create playlist';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [spotifyToken, playlistName, tracks]);

  // Clear upload status
  const clearUploadStatus = useCallback(() => {
    setTracks([]);
    setPlaylistName('');
    setPlaylistCreated(null);
    localStorage.removeItem('uploaded_tracks');
    localStorage.removeItem('playlist_name');
    toast.success('Upload status cleared');
  }, []);

  // Check token expiry and refresh if needed
  useEffect(() => {
    if (tokenExpiry && Date.now() >= tokenExpiry - (5 * 60 * 1000)) {
      refreshAccessToken();
    }
  }, [tokenExpiry, refreshAccessToken]);

  // Load saved state on mount
  useEffect(() => {
    loadSavedAuthState();
  }, [loadSavedAuthState]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleSpotifyCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleSpotifyCallback]);

  // Save tracks and playlist name to localStorage when they change
  useEffect(() => {
    if (tracks.length > 0) {
      localStorage.setItem('uploaded_tracks', JSON.stringify(tracks));
    }
  }, [tracks]);

  useEffect(() => {
    if (playlistName) {
      localStorage.setItem('playlist_name', playlistName);
    }
  }, [playlistName]);

  // Auto-search Spotify tracks when tracks are uploaded and user is connected
  useEffect(() => {
    if (tracks.length > 0 && spotifyToken && tracks[0]?.searchStatus === 'pending') {
      // Only auto-search if tracks haven't been searched yet
      const timeoutId = setTimeout(() => {
        searchSpotifyTracks(tracks);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tracks, spotifyToken, searchSpotifyTracks]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="spinner"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-gray-300">Restoring your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      
      <Header 
        isConnected={!!spotifyToken}
        onConnect={handleSpotifyAuth}
        onDisconnect={handleSpotifyDisconnect}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🧪 YCD Alchemist
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your YCD files into Spotify playlists with alchemical magic! 
            Upload your music collection and watch it transmute into a beautiful playlist.
          </p>
        </div>

        {!spotifyToken ? (
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Connect to Spotify
            </h2>
            <p className="text-gray-300 mb-6">
              First, connect your Spotify account to start creating playlists.
            </p>
            <button
              onClick={handleSpotifyAuth}
              className="btn-primary"
            >
              <span className="mr-2">🎵</span>
              Connect to Spotify
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {tracks.length === 0 ? (
              <FileUpload 
                onFileUpload={handleFileUpload}
                onClearUpload={clearUploadStatus}
                tracks={tracks}
                loading={loading}
              />
            ) : (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-white">
                      📁 File Uploaded Successfully
                    </h2>
                    <button
                      onClick={clearUploadStatus}
                      className="btn-secondary"
                    >
                      <span className="mr-2">🔄</span>
                      New Upload
                    </button>
                  </div>
                  <p className="text-gray-300">
                    {tracks.length} tracks extracted from your YCD file.
                  </p>
                </div>

                <PlaylistCreator
                  spotifyToken={spotifyToken}
                  tracks={tracks}
                  playlistName={playlistName}
                  onPlaylistNameChange={(e) => setPlaylistName(e.target.value)}
                  onCreatePlaylist={createSpotifyPlaylist}
                  loading={loading}
                  authLoading={authLoading}
                  searchProgress={searchProgress}
                />

                <TrackList 
                  tracks={tracks} 
                  onTrackSelectionChange={handleTrackSelectionChange}
                  searchProgress={searchProgress}
                  onSearchTracks={searchSpotifyTracks}
                  spotifyConnected={!!spotifyToken}
                />
              </div>
            )}

            {playlistCreated && (
              <PlaylistSuccess playlist={playlistCreated} />
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-gray-400">
        <p>✨ Created with alchemical magic by <span className="text-emerald-400 font-semibold">Ofer Bachner</span> ✨</p>
      </footer>
    </div>
  );
}

export default App;
