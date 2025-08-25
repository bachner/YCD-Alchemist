import React from 'react';
import { LogOut } from 'lucide-react';

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
        
        {isConnected && (
          <div className="auth-section">
            <button 
              onClick={onDisconnect}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
