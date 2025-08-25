# 🧪 YCD Alchemist

Transform YCD files into Spotify playlists with alchemical magic! A modern, full-stack web application that converts YCD playlist files to Spotify playlists with intelligent track matching and confidence scoring.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **🎵 YCD File Parsing**: Support for YCD, M3U, and text-based playlist formats
- **🔍 Intelligent Spotify Search**: Multi-strategy search with confidence scoring
- **🎯 Match Quality Assessment**: Color-coded confidence levels for track matches
- **📊 Progress Tracking**: Real-time search progress with visual indicators
- **🌐 Modern UI**: Clean, responsive design with glassmorphism effects
- **🔐 Secure Authentication**: Spotify OAuth 2.0 integration
- **💾 Persistent State**: Automatic saving of authentication and playlist data
- **🌍 Multi-language Support**: Handles Hebrew and international track names
- **⚡ Performance Optimized**: Efficient search algorithms and caching

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Spotify Developer Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bachner/YCD-Alchemist.git
   cd YCD-Alchemist
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` with your Spotify app credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/callback
   PORT=3000
   ```

4. **Build and start the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
ycd-alchemist/
├── backend/                 # Node.js/Express backend
│   ├── utils/              # Utility functions
│   │   ├── validation.js   # Input validation
│   │   └── errorHandler.js # Error handling
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── features/   # Feature components
│   │   │   ├── layout/     # Layout components
│   │   │   └── ui/         # UI components
│   │   ├── utils/          # Utility functions
│   │   │   ├── constants.js # App constants
│   │   │   └── helpers.js   # Helper functions
│   │   └── styles/         # CSS styles
│   └── package.json
├── test-sanity.js          # Backend health tests
├── test-browser.js         # Frontend compatibility tests
└── package.json            # Root package configuration
```

## 🎯 Usage

### 1. Connect to Spotify
- Click "Connect to Spotify" in the top-right corner
- Authorize the application to access your Spotify account

### 2. Upload YCD File
- Drag and drop a `.ycd` file or click to browse
- Maximum file size: 10MB

### 3. Review Matches
- View automatically matched Spotify tracks
- Check confidence scores for match quality
- Select/deselect tracks to include in playlist

### 4. Create Playlist
- Enter a playlist name
- Click "Create Spotify Playlist"
- Access your new playlist directly in Spotify

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | Required |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app client secret | Required |
| `SPOTIFY_REDIRECT_URI` | OAuth redirect URI | `http://localhost:3000/api/callback` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

### Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:3000/api/callback` to Redirect URIs
4. Copy Client ID and Client Secret to your `.env` file

## 🧪 Testing

Run comprehensive tests to ensure application health:

```bash
# Run all tests
npm run test-all

# Backend sanity tests
npm run test

# Frontend browser tests
npm run test-browser
```

## 📊 Confidence Scoring

The application uses a sophisticated confidence scoring system:

- **🟢 Excellent (90%+)**: Perfect or near-perfect matches
- **🟢 Very Good (75-89%)**: High confidence matches
- **🟡 Good (60-74%)**: Acceptable matches with minor differences
- **🟠 Fair (40-59%)**: Moderate confidence, review recommended
- **🔴 Poor (<40%)**: Low confidence, manual verification needed

## 🎨 Architecture

### Backend (Node.js/Express)
- **RESTful API**: Clean, documented endpoints
- **Error Handling**: Centralized error management with custom error types
- **Validation**: Comprehensive input validation and sanitization
- **Security**: CORS, rate limiting, and input sanitization
- **Performance**: Timeout handling and async optimization

### Frontend (React)
- **Modern React**: Hooks, functional components, and performance optimization
- **State Management**: Efficient local state with localStorage persistence
- **Component Architecture**: Reusable, well-documented components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Boundaries**: Graceful error handling and user feedback

## 🚀 Performance Features

- **Lazy Loading**: Components loaded on demand
- **Memoization**: Optimized re-renders with React.memo and useMemo
- **Debounced Search**: Efficient search input handling
- **Progress Tracking**: Real-time feedback for long operations
- **Caching**: Smart caching of API responses

## 🔒 Security

- **Input Validation**: Server-side validation for all inputs
- **Sanitization**: XSS protection and input cleaning
- **Rate Limiting**: Protection against abuse
- **Error Handling**: No sensitive information in error responses
- **HTTPS Ready**: Production-ready security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📝 API Documentation

### Authentication Endpoints
- `GET /api/auth-url` - Get Spotify authorization URL
- `GET /api/callback` - Handle OAuth callback
- `POST /api/refresh-token` - Refresh access token

### File Processing
- `POST /api/upload` - Upload and parse YCD file
- `POST /api/search-tracks` - Search Spotify for tracks

### Playlist Management
- `POST /api/create-playlist` - Create Spotify playlist

### Utilities
- `GET /api/health` - Health check endpoint

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ofer Bachner**

- GitHub: [@Bachner](https://github.com/bachner)
- Email: bachner@gmail.com

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for music data
- [React](https://reactjs.org/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons

## 📈 Changelog

### v1.0.0 (Current)
- Initial release
- YCD file parsing and Spotify integration
- Confidence scoring system
- Modern UI with progress tracking
- Comprehensive error handling and validation
- Multi-language support

---

Made with ❤️ and ☕ by Ofer Bachner