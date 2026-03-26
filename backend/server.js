const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const {
  generalApiLimiter,
  authLimiter,
  statusLimiter,
  transferLimiter,
  healthCheckLimiter,
} = require("./src/middleware/rateLimit");
const { initializeFirebase } = require("./src/config/firebase");
require("dotenv").config();

const authRoutes = require("./src/routes/auth");
const playlistRoutes = require("./src/routes/playlists");
const transferRoutes = require("./src/routes/transfer");
const systemRoutes = require("./src/routes/system");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase
try {
  initializeFirebase();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  // Continue without Firebase for development
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ];

    console.log("CORS Debug:", {
      origin: origin,
      allowedOrigins: allowedOrigins,
      isAllowed: allowedOrigins.includes(origin),
    });

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Session configuration
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret && isProduction) {
  console.error(
    "❌ ERROR: SESSION_SECRET MUST be set in production environment.",
  );
  process.exit(1);
}

if (!sessionSecret) {
  console.warn(
    "⚠️  WARNING: SESSION_SECRET not set in environment. Using insecure development secret.",
  );
}

const finalSecret = sessionSecret || "dev-insecure-secret-key-12345";

app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: finalSecret,
    resave: true, // Changed to true to ensure session persistence
    saveUninitialized: true, // Changed to true to save new sessions
    cookie: {
      secure: isProduction, // Use secure cookies in production (requires HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "none" : "lax", // 'none' for cross-site cookies in prod, 'lax' for dev
      domain: undefined, // Let browser set domain automatically
      path: "/",
    },
    name: "movemyplaylist.sid", // Custom session name
    rolling: true, // Extend session on each request
    unset: "destroy", // Destroy session when unset
  }),
);

// Session debugging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log("Session Debug:", {
      method: req.method,
      url: req.url,
      sessionID: req.sessionID,
      sessionExists: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      cookies: req.headers.cookie ? "Present" : "Missing",
      cookieHeader: req.headers.cookie || "None",
      host: req.headers.host,
      origin: req.headers.origin,
    });

    // Log session store info
    if (req.session && req.sessionID) {
      console.log("Session Store Info:", {
        sessionID: req.sessionID,
        sessionData: req.session,
      });
    }

    // Intercept response to log cookies being set
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      if (res.getHeader("Set-Cookie")) {
        console.log("Cookies being set:", res.getHeader("Set-Cookie"));
      }
      originalEnd.call(this, chunk, encoding);
    };

    next();
  });
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Health check endpoint
app.get("/health", healthCheckLimiter, (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Session test endpoint
app.get("/session-test", (req, res) => {
  if (!req.session.visitCount) {
    req.session.visitCount = 1;
  } else {
    req.session.visitCount++;
  }

  res.json({
    message: "Session test",
    sessionID: req.sessionID,
    visitCount: req.session.visitCount,
    sessionData: req.session,
    cookies: req.headers.cookie || "None",
    timestamp: new Date().toISOString(),
  });
});

// API routes with rate limiting
app.use("/auth", authRoutes);
app.use("/api/playlists", generalApiLimiter, playlistRoutes);
app.use("/api/transfer", transferLimiter, transferRoutes);
app.use("/api/system", systemRoutes);

// Favicon route to prevent 404 errors
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No content response
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Page not found",
    message: "The page you are looking for does not exist.",
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong. Please try again.";

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
