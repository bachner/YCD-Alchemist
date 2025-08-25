import React from 'react';
import { Play, Wand2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const PlaylistCreator = ({ 
  spotifyToken, 
  tracks, 
  playlistName, 
  onPlaylistNameChange, 
  onCreatePlaylist, 
  loading, 
  authLoading,
  searchProgress
}) => {
  return (
    <Card className="playlist-card">
      <div className="card-header">
        <Play size={24} className="card-icon" />
        <h2 className="card-title">Create Spotify Playlist</h2>
      </div>
      
      {authLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Checking for saved Spotify connection...</p>
        </div>
      ) : !spotifyToken ? (
        <div className="auth-section">
          <p className="auth-text">
            🧪 Please connect to Spotify using the button in the header to create playlists
          </p>
        </div>
      ) : (
        <div className="creator-content">
          {spotifyToken && (
            <div className="user-profile">
              <div className="user-info">
                <div className="user-name">
                  ✅ Connected to Spotify
                </div>
                {tracks.length > 0 && (
                  <div className="track-status">
                    ✅ {tracks.filter(t => t.selected).length} of {tracks.length} tracks selected
                  </div>
                )}
              </div>
            </div>
          )}
          
          {tracks.length === 0 && (
            <div className="upload-prompt">
              📁 Please upload a YCD file above to create a playlist
            </div>
          )}
          
          {tracks.length > 0 && (
            <>
              <Input
                label="Playlist Name:"
                value={playlistName}
                onChange={onPlaylistNameChange}
                placeholder="Enter playlist name..."
                dir="auto"
              />

              <Button 
                variant="primary" 
                size="large" 
                onClick={onCreatePlaylist}
                disabled={
                  loading || 
                  !playlistName.trim() || 
                  tracks.filter(t => t.selected).length === 0 ||
                  (searchProgress && searchProgress.isSearching)
                }
                className="create-button"
              >
                <Wand2 size={20} />
                {loading ? '🧪 Creating Your Playlist...' : 
                 (searchProgress && searchProgress.isSearching) ? '🔍 Searching Spotify...' :
                 '🧪 Create Spotify Playlist'}
              </Button>
              
              {!playlistName.trim() && tracks.length > 0 && !searchProgress?.isSearching && (
                <div className="hint">
                  💡 Enter a playlist name to enable the create button
                </div>
              )}
              {playlistName.trim() && tracks.filter(t => t.selected).length === 0 && tracks.length > 0 && !searchProgress?.isSearching && (
                <div className="hint">
                  💡 Select at least one track below to create the playlist
                </div>
              )}
              {searchProgress?.isSearching && (
                <div className="hint">
                  🔍 Please wait while we search for your tracks on Spotify...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default PlaylistCreator;
