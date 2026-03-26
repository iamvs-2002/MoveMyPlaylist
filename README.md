# MoveMyPlaylist 🎵

A full-stack open-source application that allows users to transfer music playlists between different music platforms using their respective APIs. Built with modern web technologies and a focus on security, performance, and user experience.

**🌐 Live: [movemyplaylist.online](https://movemyplaylist.online)**

## ✨ Features

- **Cross-Platform Playlist Transfer**: Move playlists between supported music platforms
- **Extensible Platform Architecture**: Easy to add new music platforms without code changes
- **Enhanced OAuth2 Authentication**: Secure login with PKCE support and advanced security features
- **Real-time Progress Tracking**: Monitor transfer status with live updates and progress bars
- **Intelligent Song Matching**: Advanced multi-layered algorithm to find the best matches between platforms
- **Modern UI/UX**: Clean, responsive interface built with React, TailwindCSS, and Framer Motion
- **Secure & Private**: No data storage, all transfers happen in real-time
- **Rate Limiting & Security**: Built-in protection against abuse and security vulnerabilities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Transfer Statistics**: Anonymous analytics and performance metrics stored in Firebase Firestore

## 🚀 Supported Platforms

### Currently Available
- **Spotify** - Full support for playlists, search, and user management
- **YouTube Music** - Full support for playlists, search, and user management

### Coming Soon
- **Apple Music** - Integration in development
- **Deezer** - Planned integration
- **Tidal** - Planned integration

### Adding New Platforms
The application uses a plugin-based architecture that makes adding new music platforms simple. See the [Platform Architecture](#platform-architecture) section for details.

## 🏗️ Platform Architecture

MoveMyPlaylist features a highly extensible, plugin-based architecture that makes adding new music platforms straightforward and maintainable.

### Core Components

#### 1. Platform Interface (`PlatformInterface.js`)
Defines the contract that all platform services must implement:
- Authentication methods (OAuth, API keys)
- User profile and playlist management
- Track search and matching
- Playlist creation and modification
- Error handling and validation

#### 2. Base Platform Class (`BasePlatform.js`)
Provides common functionality and utilities:
- Data normalization and standardization
- Search algorithms and similarity matching
- Rate limiting and error handling
- Utility methods for common operations

#### 3. Platform Registry (`PlatformRegistry.js`)
Dynamic system for managing platform instances:
- Automatic discovery and loading of platform plugins
- Runtime platform registration and validation
- Capability-based platform querying
- Centralized configuration management

### Adding a New Platform

To add a new music platform (e.g., Apple Music):

1. **Create Platform Configuration** (`backend/src/platforms/config/apple.js`)
   ```javascript
   module.exports = {
     id: 'apple',
     displayName: 'Apple Music',
     icon: '/icons/applemusic.svg',
     color: '#FA243C',
     capabilities: ['playlists', 'search', 'create', 'modify', 'userProfile'],
     // ... other configuration
   };
   ```

2. **Implement Platform Service** (`backend/src/platforms/apple/ApplePlatform.js`)
   ```javascript
   const BasePlatform = require('../base/BasePlatform');
   
   class ApplePlatform extends BasePlatform {
     async getUserProfile(accessToken) { /* implementation */ }
     async searchTracks(accessToken, query) { /* implementation */ }
     // ... other required methods
   }
   ```

3. **Create Index File** (`backend/src/platforms/apple/index.js`)
   ```javascript
   module.exports = require('./ApplePlatform');
   ```

4. **Add Frontend Configuration** (`frontend/src/config/platforms.js`)
   ```javascript
   {
     id: 'apple',
     name: 'Apple Music',
     displayName: 'Apple Music',
     icon: '/icons/applemusic.svg',
     color: '#FA243C',
     // ... other metadata
   }
   ```

The platform will automatically be discovered, loaded, and integrated into the application without any additional code changes!

### Benefits of This Architecture

- **🔌 Plugin-Based**: Add platforms without modifying existing code
- **🔄 Dynamic Loading**: Platforms are discovered and loaded at runtime
- **⚡ Maintainable**: Common functionality is centralized and reusable
- **🧪 Testable**: Each platform can be tested independently
- **📱 Scalable**: Easy to support dozens of music platforms
- **🎯 Consistent**: All platforms follow the same interface and patterns

## 🔐 Enhanced OAuth Implementation

MoveMyPlaylist features robust OAuth implementations that follow industry best practices for security and reliability.

### Security Features

- **PKCE (Proof Key for Code Exchange)**: Enhanced security against authorization code interception
- **State Parameter Security**: Random state generation with expiration for CSRF protection
- **Token Management**: Secure storage with automatic refresh before expiration
- **Scope Validation**: Verifies requested permissions match granted scopes
- **Comprehensive Error Handling**: Specific error codes with user-friendly messages

### Supported Authentication Methods

- **OAuth 2.0 with PKCE**: Spotify, YouTube Music
- **API Key Authentication**: YouTube Data API
- **Session Management**: Encrypted server sessions with configurable expiration

## 🧠 Smart Transfer Algorithm

MoveMyPlaylist features a highly efficient transfer algorithm that optimizes API calls while maintaining high accuracy. The algorithm uses smart batching and artist grouping to process playlists with minimal API usage, ensuring stability and speed.

### 🚀 Algorithm Features

#### **Smart Batching & Artist Grouping**
- **Groups tracks by artist** for efficient processing
- **Single API call per artist** whenever possible
- **Reuses search results** for multiple tracks from the same artist
- **Minimized API footprint** for better reliability

#### **Quota-Aware Processing**
- **Estimates quota usage** before starting transfer
- **Adapts search strategy** based on remaining quota
- **Stops early** if quota is exhausted to save remaining resources
- **Intelligent fallback** when quota is critically low

#### **Efficient Search Strategy**
- **Artist-based search**: Optimized queries for broad match discovery
- **Batch matching**: Match all tracks against cached results
- **Reduced delays**: Intelligent timing between API requests
- **Early termination**: Perfect matches stop further searching

### 🔍 How the Algorithm Works

1. **Pre-process**: Group tracks by artist
   ```
   Savi Kahlon: 1 track
   Asha Bhosle: 1 track  
   Kishore Kumar: 1 track
   Suman Kalyanpur: 1 track
   Ilaiyaraaja: 1 track
   Geeta Zaildar: 1 track
   ```

2. **Batch search**: One API call per artist
   ```
   Search "Savi Kahlon" → 50 results
   Search "Asha Bhosle" → 50 results
   Search "Kishore Kumar" → 50 results
   etc.
   ```

3. **Smart matching**: Match all tracks against results
   ```
   Track "Apa Fer Milaange" → find best match in 50 results
   Track "O Haseena..." → find best match in 50 results
   etc.
   ```

### 🎯 Algorithm Architecture

The algorithm still maintains the sophisticated multi-layered approach but with massive efficiency improvements:

```
Strategy 1: Artist-Based Batch Search (Most Efficient)
    ↓ (if no match)
Strategy 2: Album-based Search (High Accuracy)
    ↓ (if no match)
Strategy 3: Exact Song Search
    ↓ (if no match)
Strategy 4: Fuzzy Matching with Levenshtein Distance
    ↓ (if no match)
Strategy 5: Platform-Specific Fallback Methods
```

### 🔧 Search Algorithms

Three different search algorithms are available:

- **FAST (0)**: Returns first search result (fastest, least accurate)
- **STRICT (1)**: Requires exact matches (slower, more accurate)
- **SMART (2)**: Fuzzy matching with fallbacks (balanced - default)

### 🚨 Rate Limiting & Circuit Breaker

- **Intelligent circuit breaker**: Automatically opens after persistent failures to protect API quotas
- **Dynamic recovery**: Fast reset after transient errors
- **Manual reset capability**: Option to reset the circuit breaker when connectivity is restored
- **Robust error handling**: Specific context for quota issues and rate limits
- **Exponential backoff**: Intelligent retry logic for transient network or API problems

### 📈 Key Benefits

- ✅ **Minimized API usage**
- ✅ **Optimized for YouTube API quotas**
- ✅ **High success rate**
- ✅ **Fast and stable processing**
- ✅ **Context-aware error handling**
- ✅ **Quota-aware decision making**
- ✅ **Intelligent batching**
- ✅ **Artist-based optimization**

## 🔧 Technical Implementation Details

### **Smart Batching Engine**

The new algorithm implements a sophisticated batching system that groups tracks by artist for maximum efficiency:

```javascript
// Group tracks by artist for efficient searching
const artistGroups = this.groupTracksByArtist(sourceTracks);

// Process each artist group with single API call
for (const [artistName, tracks] of Object.entries(artistGroups)) {
  // Single API call per artist
  const artistSearchResults = await this.searchTracksByArtist(
    targetPlatformId, 
    accessToken, 
    artistName, 
    50 // Get more results to match multiple tracks
  );
  
  // Match all tracks from this artist against the search results
  for (const track of tracks) {
    const match = this.findBestMatchInResults(track, artistSearchResults);
    if (match) results.set(track.id, match);
  }
}
```

### **Quota-Aware Processing**

The system automatically adapts its strategy based on remaining API quota:

```javascript
// Estimate quota usage before starting
const estimation = this.estimateQuotaUsage(sourceTracks, targetPlatformId);

// Adapt search strategy based on quota
if (quotaStatus.remaining < 100) {
  limit = Math.min(limit, 10); // Reduce search limit
}

if (quotaStatus.remaining < 50) {
  throw new Error('Insufficient quota for search');
}
```

### **Intelligent Matching Algorithm**

Uses weighted scoring for optimal track matching:

```javascript
calculateMatchScore(sourceTrack, resultTrack) {
  // Name similarity (60% weight)
  const nameSimilarity = this.calculateSimilarity(sourceName, resultName);
  
  // Artist similarity (40% weight)
  const artistSimilarity = sourceArtist && resultArtist ? 
    this.calculateSimilarity(sourceArtist, resultArtist) : 0.5;
  
  // Weighted score
  return (nameSimilarity * 0.6) + (artistSimilarity * 0.4);
}
```

### **Circuit Breaker & Rate Limiting**

Enhanced protection against API failures:

```javascript
// Less aggressive circuit breaker
if (breaker.failures >= 10) { // Was 5
  breaker.state = 'OPEN';
}

// Faster recovery
if (timeSinceLastFailure > 10000) { // Was 30000ms
  breaker.state = 'HALF_OPEN';
}
```

### **Quota Management**

- **Automatic Estimation**: Calculates required quota before starting
- **Adaptive Strategy**: Reduces search limits when quota is low
- **Early Termination**: Stops processing to preserve remaining quota
- **Smart Fallbacks**: Graceful degradation for low-quota scenarios

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS version recommended)
- **npm** or **yarn** package manager
- **Spotify Developer Account** with API credentials
- **YouTube Data API v3 Key** and OAuth credentials

### 1. Clone and Setup

```bash
git clone https://github.com/iamvs-2002/movemyplaylist.git
cd movemyplaylist
```

### 2. Environment Configuration

#### Backend Environment
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your credentials:
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"}

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3001/auth/spotify/callback

# YouTube Music API Configuration
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3001/auth/youtube/callback
YOUTUBE_API_KEY=your_youtube_api_key
```

#### Frontend Environment
```bash
cd frontend
cp env.example .env
```

Edit `frontend/.env` with your credentials:
```env
# Backend API URL
VITE_API_URL=http://localhost:3001

# Spotify OAuth
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id

# YouTube Music OAuth
VITE_YOUTUBE_CLIENT_ID=your_youtube_client_id
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Run the Application

```bash
# Terminal 1 - Backend Server
cd backend
npm run dev

# Terminal 2 - Frontend Development Server
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🏗️ Project Architecture

```
movemyplaylist/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Header.jsx    # Navigation and authentication
│   │   │   ├── Footer.jsx    # Site footer
│   │   │   ├── Toast.jsx     # Notification system
│   │   │   ├── PlatformCard.jsx # Generic platform display component
│   │   │   ├── PlatformSelector.jsx # Platform selection interface
│   │   │   └── ErrorBoundary.jsx # Error handling
│   │   ├── pages/            # Page components
│   │   │   ├── LandingPage.jsx    # Homepage with features
│   │   │   ├── TransferPage.jsx   # Playlist transfer interface
│   │   │   ├── Dashboard.jsx      # User dashboard
│   │   │   └── TransferProgress.jsx # Transfer monitoring
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useAuth.js    # Authentication state management
│   │   │   ├── usePlatforms.js # Platform state management
│   │   │   ├── useNetworkStatus.js # Network monitoring
│   │   │   └── useScrollToTop.js  # Navigation utilities
│   │   ├── config/           # Configuration files
│   │   │   └── platforms.js  # Platform configurations
│   │   ├── utils/            # Utility functions
│   │   │   ├── api.js        # API communication
│   │   │   ├── enhancedApi.js # Enhanced API with retry logic
│   │   │   └── errorHandler.jsx # Error handling utilities
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.js       # Authentication endpoints
│   │   │   ├── playlists.js  # Playlist management
│   │   │   ├── transfer.js   # Transfer operations
│   │   │   └── system.js     # System utilities
│   │   ├── controllers/      # Business logic controllers
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── playlistController.js # Playlist operations
│   │   │   ├── transferController.js # Transfer orchestration
│   │   │   └── systemController.js  # System operations
│   │   ├── services/         # External API services
│   │   │   ├── apiService.js # HTTP client
│   │   │   ├── transferService.js    # Transfer algorithm
│   │   │   └── firestoreService.js   # Firebase Firestore integration
│   │   ├── platforms/        # Platform implementations
│   │   │   ├── base/         # Base classes and interfaces
│   │   │   │   ├── PlatformInterface.js # Platform contract
│   │   │   │   ├── BasePlatform.js # Common functionality
│   │   │   │   └── PlatformRegistry.js # Platform management
│   │   │   ├── config/       # Platform configurations
│   │   │   │   ├── spotify.js # Spotify configuration
│   │   │   │   └── youtube.js # YouTube configuration
│   │   │   ├── spotify/      # Spotify platform implementation
│   │   │   │   ├── SpotifyPlatform.js # Spotify service
│   │   │   │   └── index.js  # Export file
│   │   │   ├── youtube/      # YouTube platform implementation
│   │   │   │   ├── YouTubePlatform.js # YouTube service
│   │   │   │   └── index.js  # Export file
│   │   │   └── index.js      # Platform system entry point
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.js       # Authentication middleware
│   │   │   ├── rateLimit.js  # Rate limiting protection
│   │   │   └── validation.js # Request validation
│   │   ├── config/           # Configuration files
│   │   │   ├── transferConfig.js     # Transfer algorithm settings
│   │   │   └── firebase.js           # Firebase configuration
│   │   └── utils/            # Utility functions
│   │       ├── api.js        # API utilities
│   │       └── crypto.js     # Cryptographic functions
│   ├── server.js             # Main server entry point
│   └── package.json          # Backend dependencies
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore patterns
├── LICENSE                   # MIT License
└── README.md                 # This file
```

## 🔥 Firebase Firestore Integration

MoveMyPlaylist uses Firebase Firestore to store anonymous transfer statistics and performance metrics. This provides insights into platform usage without storing any personal user information.

### Key Features

- **Platform Agnostic Design**: Automatically adapts to new platforms
- **Anonymous Analytics**: No personal user data stored
- **Real-Time Updates**: Live statistics as transfers happen
- **Transaction Safety**: Uses Firestore transactions for data consistency

### Collections

- **`transfers`** - Individual transfer records with platform-agnostic structure
- **`transferStats`** - Aggregated global statistics that automatically include new platforms

## 🎨 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions
- **React Router** - Client-side routing
- **React Query** - Data fetching and state management
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Express Session** - Session management with encryption
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API abuse protection
- **Compression** - Response compression
- **Firebase Admin SDK** - Firestore database integration
- **PKCE Support** - Enhanced OAuth security with Proof Key for Code Exchange
- **Cryptographic Functions** - Secure random generation and hashing

### External APIs
- **Spotify Web API** - Music streaming service integration
- **YouTube Data API v3** - Video platform integration
- **OAuth 2.0** - Secure authentication protocol
- **Firebase Firestore** - NoSQL cloud database for statistics

### Advanced Features
- **Multi-layered Search Algorithm** - Sophisticated track matching with fallback strategies
- **Levenshtein Distance** - Fuzzy string matching for improved accuracy
- **Rate Limiting & Circuit Breakers** - Robust API communication with automatic retry logic
- **Configurable Matching** - Adjustable similarity thresholds and search strategies
- **PKCE OAuth Security** - Enhanced authentication with Proof Key for Code Exchange
- **Automatic Token Refresh** - Seamless user experience with background token management
- **Comprehensive Error Handling** - Specific error codes with user-friendly messages
- **Environment Validation** - Automatic configuration validation and error prevention
- **Extensible Platform Architecture** - Plugin-based system for easy platform integration

## 🔐 Authentication Flow

1. **User Initiation**: User clicks "Login with [Platform]"
2. **OAuth Redirect**: Redirected to respective OAuth provider
3. **User Authorization**: User grants permissions to the application
4. **Callback Processing**: OAuth provider redirects back with authorization code
5. **Token Exchange**: Backend exchanges code for access/refresh tokens
6. **Session Creation**: Tokens stored securely in encrypted session
7. **Dashboard Access**: User redirected to authenticated dashboard

## 📱 User Experience Features

### Landing Page
- **Hero Section**: Clear value proposition and call-to-action
- **Feature Highlights**: Key benefits and capabilities
- **Statistics**: Social proof and platform metrics
- **How It Works**: Step-by-step process explanation
- **Trust Indicators**: Security and privacy assurances

### Transfer Interface
- **Dynamic Platform Selection**: Choose from available platforms
- **Playlist Browsing**: Browse and select playlists to transfer
- **Real-time Progress**: Live transfer status and progress tracking
- **Error Handling**: Graceful error handling with user-friendly messages
- **Success Confirmation**: Transfer completion with playlist links
- **Advanced Matching**: Configurable search algorithms (FAST, STRICT, SMART)
- **Match Quality**: Visual indicators for track match confidence
- **Batch Processing**: Efficient handling of large playlists with rate limiting

### Dashboard
- **Authentication Status**: Current platform connections
- **Transfer History**: Previous transfers and their status
- **Quick Actions**: Start new transfers or manage existing ones
- **Account Management**: Platform connection management

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm install --production
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

### Environment Variables
Ensure all required environment variables are set in production:
- API credentials for supported platforms
- Secure session secrets
- Proper CORS origins
- Firebase project configuration and service account credentials
- Production database connections (if applicable)

### Production Considerations
- **HTTPS**: Always use HTTPS in production
- **Environment Variables**: Secure credential management
- **Rate Limiting**: Configure appropriate rate limits
- **Monitoring**: Implement logging and monitoring
- **Backup**: Regular data backup procedures
- **Firebase Security**: Configure proper Firestore security rules
- **Firebase Billing**: Monitor Firestore usage and costs

## 🤝 Contributing

We welcome contributions from the community! This is an open-source project, and we appreciate all forms of contributions including bug reports, feature requests, documentation improvements, and code contributions.

### 🚫 Important: Branch Protection

**The `main` branch is protected and cannot be directly pushed to by contributors.** This ensures code quality and project stability.

### 📋 Contribution Workflow

1. **Fork the Repository**
   - Click the "Fork" button on GitHub to create your own copy
   - Clone your fork locally: `git clone https://github.com/YOUR_USERNAME/movemyplaylist.git`

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or for bug fixes:
   git checkout -b fix/bug-description
   # or for documentation:
   git checkout -b docs/improvement-description
   ```

3. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the existing code style and patterns
   - Add tests for new functionality
   - Update documentation if needed

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # Use conventional commit format:
   # feat: new feature
   # fix: bug fix
   # docs: documentation changes
   # style: formatting changes
   # refactor: code refactoring
   # test: adding tests
   # chore: maintenance tasks
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch as the source
   - Write a clear description of your changes
   - Link any related issues

### 🔒 Pull Request Requirements

All pull requests must meet these criteria before merging:

- **Code Review**: At least one maintainer must approve the PR
- **Tests Pass**: All automated tests must pass
- **No Conflicts**: Must be up-to-date with the main branch
- **Conventional Commits**: Follow the commit message format
- **Description**: Clear explanation of changes and reasoning

### 📝 Code Style Guidelines

- **JavaScript/JSX**: Follow existing patterns and use ESLint rules
- **CSS/Tailwind**: Use utility classes and maintain consistency
- **Naming**: Use descriptive names for variables, functions, and files
- **Comments**: Add JSDoc comments for complex functions
- **Error Handling**: Include proper error handling and user feedback

### 🧪 Testing Requirements

- **Frontend**: Test on multiple browsers and screen sizes
- **Backend**: Ensure API endpoints work correctly
- **OAuth Flows**: Verify authentication works for all platforms
- **Responsive Design**: Check mobile and tablet layouts
- **Error Scenarios**: Test error handling and edge cases
- **Platform Integration**: Test new platform implementations thoroughly

### 🚨 What NOT to Do

- **Don't push directly to main** - Always use pull requests
- **Don't commit API keys or secrets** - Use environment variables
- **Don't ignore linting errors** - Fix all code style issues
- **Don't skip tests** - Ensure all tests pass before submitting
- **Don't make breaking changes** without discussion

### 🎯 Good First Issues

New contributors can start with these:

- **Documentation**: Improve README, add examples
- **UI Polish**: Fix minor styling issues, improve accessibility
- **Testing**: Add unit tests for existing functions
- **Bug Fixes**: Fix minor bugs or edge cases
- **Performance**: Optimize existing code
- **Platform Integration**: Help implement new music platforms

### 📚 Development Setup

For contributors who want to run the project locally:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/movemyplaylist.git
cd movemyplaylist

# Set up backend
cd backend
cp env.example .env
# Edit .env with your API credentials
npm install
npm run dev

# Set up frontend (in another terminal)
cd frontend
cp env.example .env
# Edit .env with your API credentials
npm install
npm run dev
```

### 🔍 Code Review Process

1. **Automated Checks**: GitHub Actions run tests and linting
2. **Maintainer Review**: At least one maintainer reviews the code
3. **Feedback**: Address any review comments or requested changes
4. **Approval**: PR is approved and ready for merge
5. **Merge**: Maintainers merge the PR to main

### 🏆 Recognition

Contributors will be recognized in:
- **Contributors section** of the README
- **GitHub contributors** page
- **Release notes** for significant contributions
- **Project documentation** where applicable

### 📞 Getting Help

If you need help contributing:

- **GitHub Issues**: Ask questions and get help
- **Issue Comments**: Discuss specific issues or features
- **Pull Request Reviews**: Get feedback on your code
- **Community Chat**: Join our community channels

## 🐛 Troubleshooting

### Common Issues

**Platform API Errors**
- Verify redirect URI matches exactly in platform Developer Dashboard
- Check client ID and secret are correct
- Ensure required scopes are enabled
- Verify OAuth configuration is properly set up
- Check state parameter validation and expiration settings

**CORS Problems**
- Verify FRONTEND_URL in backend .env matches frontend URL
- Check CORS configuration in server.js
- Ensure proper headers are set

**Authentication Failures**
- Clear browser cookies and local storage
- Verify session configuration
- Check OAuth callback URLs

**Transfer Algorithm Issues**
- **Low Match Rate**: Check similarity thresholds in config, verify artist name consistency
- **Rate Limiting Errors**: The new algorithm automatically handles rate limiting with smart batching
- **Quota Exceeded**: New quota-aware processing prevents this - check if you're using the latest version
- **Memory Issues**: New algorithm processes tracks in batches, reducing memory usage
- **Algorithm Performance**: Use FAST for quick transfers, SMART for production, STRICT for high accuracy
- **Batch Processing Issues**: Ensure tracks have proper artist information for grouping
- **API Call Efficiency**: New algorithm should use 80% fewer API calls - monitor backend logs

**Platform Integration Issues**
- Verify platform configuration files are properly formatted
- Check platform implementation follows the interface contract
- Ensure platform index files export the correct class
- Verify platform registry is properly initialized

### Getting Help

- **GitHub Issues**: Check existing issues or create new ones
- **Email Support**: Reach out at [movemyplaylist.online@gmail.com](mailto:movemyplaylist.online@gmail.com)
- **Documentation**: Review this README and code comments
- **Community**: Join our community discussions

## 📄 License & Open-Source Principles

MoveMyPlaylist operates under a **Strict Open-Source & Non-Commercial License** optimized for user privacy and "Bring Your Own Key" (BYOK) architecture. 

**Core Tenets:**
- **Strictly Non-Commercial:** You may not commercialize, monetize, sell, or attach advertisements to this software. SaaS wrapper monetization is expressly forbidden.
- **Strictly Open Source (Copyleft):** Any adaptations, derivative works, or network-hosted deployments of this code MUST be open-sourced under this exact same license.
- **BYOK Privacy Guarantee:** The application is built such that users inject their own API keys per session. No keys are centrally collected, stored, or proxied to bypass platform rate-limits.

Please see the full [LICENSE](LICENSE) file for the exact legal prerequisites. By using, cloning, or distributing this software, you agree to these copyleft and non-commercial principles.
## 🙏 Acknowledgments

- **Spotify Web API** team for excellent documentation and API
- **YouTube Data API** team for comprehensive music platform integration
- **React** and **Vite** communities for amazing developer tools
- **TailwindCSS** team for the utility-first CSS framework
- **Framer Motion** team for smooth animation capabilities
- **Open Source Community** for inspiration and collaboration

## 🔮 Roadmap

### ✅ Recently Implemented
- **Efficient Transfer Algorithm**: Revolutionary smart batching and artist grouping system
- **Quota-Aware Processing**: Intelligent API quota management and optimization
- **Enhanced Circuit Breaker**: Less aggressive rate limiting with faster recovery
- **Smart Batching Engine**: 80% reduction in API calls while maintaining accuracy
- **Artist-Based Grouping**: Single API call per artist for multiple tracks

### Planned Features
- **Apple Music Integration**: Support for Apple Music platform
- **Batch Transfers**: Transfer multiple playlists simultaneously
- **Advanced Matching**: Machine learning for better song matching
- **Playlist Templates**: Pre-built playlist collections
- **Mobile App**: Native mobile applications
- **Analytics Dashboard**: Transfer statistics and insights
- **User Feedback Integration**: Learn from successful/failed matches
- **Enhanced Security**: Additional OAuth security features and audit logging
- **Multi-Factor Authentication**: Support for additional authentication methods

### Performance Improvements
- **Caching Layer**: Redis-based caching for API responses
- **Background Jobs**: Queue-based transfer processing
- **Database Integration**: Persistent storage for transfer history
- **CDN Integration**: Global content delivery optimization

### Platform Expansion
- **Deezer**: European music streaming service
- **Tidal**: High-fidelity music streaming
- **Amazon Music**: Amazon's music platform
- **SoundCloud**: User-generated content platform
- **Bandcamp**: Independent artist platform

---

**Made with ❤️ by the MoveMyPlaylist team**

*Transfer your music, not your worries.*
