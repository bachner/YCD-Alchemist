import React from 'react';
import PropTypes from 'prop-types';
import { Music, Check, X, ExternalLink, Search, Target } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { 
  formatDuration, 
  getConfidenceColor, 
  getConfidenceLabel,
  calculateConfidenceDistribution,
  calculateAverageConfidence
} from '../../utils/helpers';

const TrackList = ({ tracks, onTrackSelectionChange, searchProgress, onSearchTracks, spotifyConnected }) => {
  if (tracks.length === 0) {
    return null;
  }

  const hasUnsearchedTracks = tracks.some(t => t.searchStatus === 'pending');

  const handleTrackToggle = (index) => {
    if (onTrackSelectionChange) {
      onTrackSelectionChange(index);
    }
  };



  return (
    <div className="track-list-container">
      <Card>
        <div className="card-header">
          <Music size={24} className="card-icon" />
          <h2 className="card-title">Spotify Track Matches</h2>
          <p className="text-gray-400 text-sm">
            {searchProgress && searchProgress.isSearching 
              ? 'Searching Spotify for your tracks...' 
              : 'Select which tracks to include in your playlist'
            }
          </p>
        </div>
        
        {/* Search Progress Bar */}
        {searchProgress && searchProgress.isSearching && (
          <div className="mb-6">
            <ProgressBar 
              current={searchProgress.current}
              total={searchProgress.total}
              label={
                <div className="flex items-center space-x-2">
                  <Search size={16} className="text-emerald-600" />
                  <span>Searching Spotify tracks...</span>
                </div>
              }
            />
          </div>
        )}

        {/* Search Button */}
        {hasUnsearchedTracks && spotifyConnected && !searchProgress?.isSearching && (
          <div className="mb-6 text-center">
            <button
              onClick={() => onSearchTracks && onSearchTracks(tracks)}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Search size={16} />
              <span>🔍 Search Spotify for Tracks</span>
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Find your tracks on Spotify to add them to playlists
            </p>
          </div>
        )}
        
        <div className="track-list space-y-3">
                           {tracks.map((track, index) => (
                   <div key={index} className={`track-item p-4 rounded-lg border transition-all w-full ${
                     track.selected
                       ? 'bg-emerald-50 border-emerald-200'
                       : 'bg-gray-50 border-gray-200'
                   }`}>
                     <div className="flex items-start justify-between min-h-[60px] w-full">
                {/* Track Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {/* Selection Toggle */}
                    <button
                      onClick={() => handleTrackToggle(index)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        track.selected
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-emerald-300'
                      }`}
                    >
                      {track.selected && <Check size={14} />}
                    </button>

                    {/* Track Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {track.spotifyTrack ? track.spotifyTrack.name : track.title}
                        </h3>
                        {track.spotifyTrack && (
                          <a
                            href={track.spotifyTrack.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">
                          {track.spotifyTrack ? track.spotifyTrack.artists : track.artist}
                        </span>
                        {track.spotifyTrack && track.spotifyTrack.album && (
                          <span className="text-gray-500"> • {track.spotifyTrack.album}</span>
                        )}
                        {track.spotifyTrack && track.spotifyTrack.duration_ms && (
                          <span className="text-gray-500"> • {formatDuration(track.spotifyTrack.duration_ms)}</span>
                        )}
                      </div>

                      {/* Original YCD Info */}
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Original:</span> {track.title} by {track.artist}
                      </div>
                    </div>
                  </div>
                </div>

                                       {/* Status Indicator with Confidence */}
                       <div className="ml-4 text-right min-w-[120px]">
                         {track.searchStatus === 'pending' || (searchProgress?.isSearching && !track.spotifyTrack) ? (
                           <div className="flex items-center justify-end space-x-1 text-blue-600">
                             <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                             <span className="text-sm font-medium">Searching...</span>
                           </div>
                         ) : track.spotifyTrack ? (
                           <div className="space-y-1">
                             <div className="flex items-center justify-end space-x-1 text-emerald-600">
                               <Check size={16} />
                               <span className="text-sm font-medium">Found</span>
                             </div>
                             {track.confidence !== undefined && (
                               <div className={`flex items-center justify-end space-x-1 ${getConfidenceColor(track.confidence)}`}>
                                 <Target size={12} />
                                 <span className="text-xs font-medium">
                                   {track.confidence}% {getConfidenceLabel(track.confidence)}
                                 </span>
                               </div>
                             )}
                           </div>
                         ) : track.searchStatus === 'not_found' ? (
                           <div className="flex items-center justify-end space-x-1 text-red-600">
                             <X size={16} />
                             <span className="text-sm font-medium">Not Found</span>
                           </div>
                         ) : (
                           <div className="flex items-center justify-end space-x-1 text-gray-400">
                             <span className="text-sm font-medium">Ready</span>
                           </div>
                         )}
                       </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-gray-600">
              Selected: <span className="font-semibold text-emerald-600">
                {tracks.filter(t => t.selected).length}
              </span> of {tracks.length} tracks
            </div>
            <div className="text-gray-600">
              Found on Spotify: <span className="font-semibold text-emerald-600">
                {tracks.filter(t => t.spotifyTrack).length}
              </span>
            </div>
            <div className="text-gray-600">
              {tracks.filter(t => t.confidence !== undefined).length > 0 && (
                <>
                  Avg. Confidence: <span className={`font-semibold ${
                    getConfidenceColor(calculateAverageConfidence(tracks))
                  }`}>
                    {calculateAverageConfidence(tracks)}%
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Confidence Breakdown */}
          {tracks.filter(t => t.confidence !== undefined).length > 0 && (
            <ConfidenceBreakdown tracks={tracks} />
          )}
        </div>
      </Card>
    </div>
  );
};

// Separate component for confidence breakdown
const ConfidenceBreakdown = ({ tracks }) => {
  const distribution = calculateConfidenceDistribution(tracks);
  
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs text-gray-500 mb-2">Match Quality Distribution:</div>
      <div className="flex space-x-4 text-xs">
        <span className="text-emerald-600">
          Excellent (90%+): {distribution.excellent}
        </span>
        <span className="text-green-600">
          Very Good (75-89%): {distribution.veryGood}
        </span>
        <span className="text-yellow-600">
          Good (60-74%): {distribution.good}
        </span>
        <span className="text-orange-600">
          Fair (40-59%): {distribution.fair}
        </span>
        <span className="text-red-600">
          Poor (&lt;40%): {distribution.poor}
        </span>
      </div>
    </div>
  );
};

// PropTypes for type checking
TrackList.propTypes = {
  tracks: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    artist: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    searchStatus: PropTypes.oneOf(['pending', 'searching', 'found', 'not_found']),
    spotifyTrack: PropTypes.object,
    confidence: PropTypes.number
  })).isRequired,
  onTrackSelectionChange: PropTypes.func,
  searchProgress: PropTypes.shape({
    current: PropTypes.number,
    total: PropTypes.number,
    isSearching: PropTypes.bool
  }),
  onSearchTracks: PropTypes.func,
  spotifyConnected: PropTypes.bool
};

TrackList.defaultProps = {
  onTrackSelectionChange: null,
  searchProgress: null,
  onSearchTracks: null,
  spotifyConnected: false
};

ConfidenceBreakdown.propTypes = {
  tracks: PropTypes.array.isRequired
};

export default TrackList;
