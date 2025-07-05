# Botijela Web Agent Guide

## Commands
- **Start dev server**: `npm run dev` (nodemon with polling)
- **Start production**: `npm start`
- **Install dependencies**: `npm install`
- **No test framework configured** - add tests if needed

## Architecture
- **Express.js** web app with Handlebars templates
- **Authentication**: Twitch OAuth via Passport.js
- **Session management**: express-session with cookies
- **Internationalization**: i18next with backend file loading
- **Security**: Helmet, rate limiting, CORS configured
- **Static files**: Bootstrap, jQuery served from node_modules and public/
- **API communication**: BaseApiService for external bot API calls

## Code Style
- **ES6 modules** (`import/export`) - project uses `"type": "module"`
- **File structure**: `src/` contains config, middleware, routes, services, views
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Error handling**: Try/catch blocks, middleware-based error handling
- **Config**: Environment variables via dotenv, centralized in `src/config/`
- **Services**: Class-based API services extending BaseApiService
- **Routes**: Express router modules in `src/routes/`
- **Middleware**: Separate modules for auth, security, sessions, i18n
