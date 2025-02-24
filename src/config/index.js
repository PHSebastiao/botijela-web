import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "TWITCH_CLIENT_ID",
  "TWITCH_CLIENT_SECRET",
  "SESSION_SECRET",
  "GENERAL_CALLBACK_URL",
  "ADVANCED_CALLBACK_URL",
  'NODE_ENV', 'PORT', 'BOT_API_URL'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export default {
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    config: {
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    },
  },
  callbacks: {
    general: process.env.GENERAL_CALLBACK_URL,
    advanced: process.env.ADVANCED_CALLBACK_URL,
  },
  apiUrl: process.env.API_URL,
  port: process.env.PORT || 4200,
  host: process.env.HOST || "0.0.0.0",
};
