import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Sparkles, Zap, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const FileUpload = ({ onFileUpload, onClearUpload, tracks, loading }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.name.toLowerCase().endsWith('.ycd')) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.ycd']
    },
    multiple: false
  });

  const handleClearUpload = () => {
    onClearUpload();
  };

  // Show clear button if tracks are uploaded
  if (tracks.length > 0) {
    return (
      <div className="upload-section">
        <Card className="clear-card">
          <div className="clear-content">
            <div className="upload-status">
              <Music size={32} className="status-icon" />
              <div className="status-text">
                <h3>File Uploaded Successfully</h3>
                <p>{tracks.length} tracks extracted and ready for conversion</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="medium" 
              onClick={handleClearUpload}
              className="clear-button"
            >
              <RefreshCw size={20} />
              Upload New File
            </Button>
          </div>
        </Card>

        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <Music size={32} className="stat-icon" />
              <div className="stat-number">{tracks.length}</div>
              <div className="stat-label">Total Tracks</div>
            </div>
            <div className="stat-card">
              <Sparkles size={32} className="stat-icon" />
              <div className="stat-number">{tracks.filter(t => t.artist).length}</div>
              <div className="stat-label">With Artist Info</div>
            </div>
            <div className="stat-card">
              <Zap size={32} className="stat-icon" />
              <div className="stat-number">{tracks.filter(t => t.album).length}</div>
              <div className="stat-label">With Album Info</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show upload form if no tracks
  return (
    <div className="upload-section">
      <Card 
        variant="upload" 
        className={`upload-card ${isDragActive ? 'dragover' : ''}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div className="upload-content">
          <Upload size={48} className="upload-icon" />
          <h3 className="upload-title">
            {isDragActive ? 'Drop your YCD file here' : 'Upload YCD File'}
          </h3>
          <p className="upload-text">
            Drag and drop your YCD file here, or click to browse
          </p>
          <p className="upload-hint">
            Only .ycd files are supported
          </p>
        </div>
      </Card>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>🧪 Performing alchemy on your music collection...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
