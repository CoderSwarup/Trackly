# 💬 Live Chat & Location Sharing App (Trackly)

A real-time & Scalable chat application built with React Native and Node.js that lets users chat and share their location with live tracking features.

## 🚀 Features

- **Real-time Chat** - Send and receive messages instantly
- **User Authentication** - Secure JWT-based login system
- **Live Location Sharing** - Share your location with real-time updates
- **One-time Location** - Share your current location once
- **Interactive Maps** - View locations on interactive maps
- **Online Status** - See who's online and active
- **Dark & Light Mode** - Switch between themes
- **Professional UI** - WhatsApp-style modern interface
- **Scalable Architecture** - Built with Redis Pub/Sub for multiple server instances

## 🛠️ Tech Stack

### Frontend (React Native)

- **React Native** - Mobile app framework
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Socket.io Client** - Real-time communication
- **React Native Maps** - Interactive maps
- **Expo Location** - GPS location services
- **Async Storage** - Local data storage

### Backend (Node.js)

- **Node.js & Express** - Server framework
- **Socket.io** - Real-time WebSocket communication
- **Redis** - In-memory data storage & Pub/Sub for scalability
- **JWT** - Authentication tokens
- **Bcrypt** - Password encryption
- **Winston** - Logging system
- **Joi** - Data validation

## 📱 Screenshots

The app includes:

- Real-time messaging with timestamps
- Live location tracking with map preview
- User online status indicators
- Professional location message cards
- Interactive full-screen maps

## 🔧 Local Setup

### Prerequisites

Make sure you have these installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Redis** server
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android) or **Xcode** (for iOS)

### 1. Clone the Repository

```bash
git clone https://github.com/CoderSwarup/Trackly.git
cd Trackly
```

### 2. Setup Backend Server

```bash
# Go to server folder
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit the `.env` file:**

```env
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

**Start Redis server:**

```bash
# On Windows (if Redis is installed)
redis-server

# On Mac with Homebrew
brew services start redis

# On Linux
sudo service redis-server start
```

**Start the backend:**

```bash
npm run dev
```

Server will run on `http://localhost:5000`

### 3. Setup React Native Client

```bash
# Go to client folder
cd ../client

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit the `.env` file:**

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Start the React Native app:**

```bash
npx expo start
```

### 4. Run on Device/Emulator

After running `npm start`, you'll see a QR code. You can:

**For Physical Device:**

1. Install **Expo Go** app from App Store/Play Store
2. Scan the QR code with Expo Go app

**For Emulator:**

- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)

## 🎯 How to Use

1. **Register/Login** - Create an account or login with existing credentials
2. **Start Chatting** - Send text messages in real-time
3. **Share Location** - Tap location button to share your current location
4. **Live Location** - Enable live location for continuous tracking
5. **View Maps** - Tap on location messages to see full map view
6. **Switch Themes** - Toggle between dark and light mode

## 📂 Project Structure

```
2_Live_Chat/
├── client/                 # React Native frontend
│   ├── app/               # Screen components
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Socket, Theme)
│   ├── config/            # API configuration
│   └── assets/            # Images and fonts
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   ├── socket/        # Socket.io handlers
│   │   └── utils/         # Helper functions
│   └── logs/              # Application logs
└── README.md
```

## 🔌 API Endpoints

- `POST /api/v1/users/auth` - User authentication
- `GET /api/v1/chat/messages` - Get chat messages
- `GET /api/v1/users/active` - Get online users

**Socket Events:**

- `login` - User authentication
- `send_message` - Send chat message
- `share_location` - Share one-time location
- `start_live_location` - Start live location sharing
- `update_live_location` - Update live location
- `stop_live_location` - Stop live location sharing

## ⚡ Scalability Features

- **Redis Pub/Sub** - Scalable real-time messaging across multiple servers
- **Horizontal Scaling** - Can run multiple server instances behind load balancer
- **Session Management** - Redis-based user session storage
- **Real-time Sync** - All server instances stay synchronized via Redis

## 🛡️ Security Features

- JWT token-based authentication
- Password encryption with bcrypt
- Input validation with Joi
- Rate limiting
- CORS protection

## 🐛 Troubleshooting

**Common Issues:**

1. **Redis Connection Error**

   - Make sure Redis server is running
   - Check Redis URL in .env file

2. **Location Not Working**

   - Enable location permissions on device
   - Check if location services are enabled

3. **Socket Connection Failed**

   - Verify server is running on correct port
   - Check SOCKET_URL in client .env file

4. **App Not Loading**
   - Clear Expo cache: `expo start -c`
   - Restart Metro bundler

## 📝 Environment Variables

**Server (.env):**

```env
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CORS_ORIGIN=*
```

**Client (.env):**

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Chatting! 🎉**

For any issues or questions, please create an issue in the repository.
