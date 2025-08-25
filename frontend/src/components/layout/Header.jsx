import React from 'react';
import { LogOut, Github } from 'lucide-react';

const Header = ({ 
  isConnected, 
  onConnect: _onConnect,
  onDisconnect 
}) => {
  return (
    <header className="header-container">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo-text">🧪 YCD Alchemist</h1>
          <p className="text-white/80 text-sm text-shadow">Transform your YCD files into Spotify playlists</p>
        </div>
        
        <div className="header-actions flex items-center space-x-4">
          <a
            href="https://github.com/bachner/YCD-Alchemist"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-emerald-400 transition-colors duration-200 flex items-center space-x-1 text-sm"
            title="View source code on GitHub"
          >
            <Github size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          
          {isConnected && (
            <button 
              onClick={onDisconnect}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
