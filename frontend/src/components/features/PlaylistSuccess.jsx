import React from 'react';
import { CheckCircle, Copy, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const PlaylistSuccess = ({ playlistCreated, playlistName, onCreateAnother }) => {
  if (!playlistCreated) {
    return null;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playlistCreated.playlistUrl);
    // You can add a toast notification here if you want
  };

  return (
    <div className="success-container">
      <Card className="success-card">
        <div className="success-content">
          <CheckCircle className="success-icon" />
          <h3 className="success-title">Playlist Created Successfully! 🎉</h3>
          
          <div className="success-message">
            <p>
              <strong>Playlist:</strong> {playlistName}
            </p>
            <p>
              <strong>URL:</strong>{' '}
              <a 
                href={playlistCreated.playlistUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="playlist-link"
              >
                {playlistCreated.playlistUrl}
              </a>
            </p>
            <p>
              <strong>Tracks Added:</strong> {playlistCreated.tracksAdded || 0} / {playlistCreated.totalTracks || 0}
            </p>
          </div>

          {playlistCreated.tracksAdded === 0 && (
            <div className="warning-message">
              ⚠️ No tracks were added to the playlist. This might be due to track matching issues or search API errors.
            </div>
          )}

          <div className="action-buttons">
            <Button 
              variant="outline" 
              size="medium" 
              onClick={handleCopyLink}
              className="copy-button"
            >
              <Copy size={20} />
              Copy Link
            </Button>
            
            <Button 
              variant="secondary" 
              size="medium" 
              onClick={onCreateAnother}
              className="create-another-button"
            >
              <Plus size={20} />
              Create Another Playlist
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlaylistSuccess;
