import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// For local development, we'll use a mock auth system
const isLocalDevelopment = process.env.NODE_ENV === 'development' && !process.env.REPL_ID?.startsWith('repl-');

if (!isLocalDevelopment && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    if (isLocalDevelopment) {
      // Return a mock config for local development
      return null;
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (isLocalDevelopment) {
    // For local development, use a simple mock auth
    console.log("🔓 Running in local development mode - authentication disabled");
    
    // Add mock login/logout routes for local development
    app.get("/api/login", (req, res) => {
      // In local dev, just redirect to home (auto-logged in)
      res.redirect("/");
    });
    
    app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });
    
    app.get("/api/callback", (req, res) => {
      res.redirect("/");
    });
    
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any) => {
      if (err) {
        console.error("Auth error:", err);
        return res.redirect("/api/login?error=auth_failed");
      }
      if (!user) {
        console.error("No user returned from auth");
        return res.redirect("/api/login?error=no_user");
      }
      req.logIn(user, (err: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/api/login?error=login_failed");
        }
        
        // Force session save before redirect
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.redirect("/api/login?error=session_save_failed");
          }
          // Successful authentication, redirect to home
          console.log("Authentication successful, redirecting to home");
          return res.redirect("/");
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // In local development, bypass authentication
  if (isLocalDevelopment) {
    // Mock a local user for development
    (req as any).user = {
      claims: {
        sub: 'local-dev-user',
        email: 'dev@localhost',
        name: 'Local Developer'
      }
    };
    return next();
  }

  // Check if user is authenticated first
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  
  // If no user object or missing expires_at, treat as unauthorized
  if (!user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  
  // If token is still valid, proceed
  if (now < user.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log("No refresh token available, redirecting to login");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    console.log("Attempting to refresh expired token");
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log("Token refreshed successfully");
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
