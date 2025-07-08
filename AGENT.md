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

## Frontend Features
- **Drag & drop queues**: SortableJS integration for queue item reordering
- **Dynamic UI**: jQuery-based interactions with Bootstrap components
- **Toast notifications**: Client-side and server-side toast system
- **Theme switching**: Dark/light theme toggle with cookie persistence
- **Tooltips**: Bootstrap tooltip integration throughout UI
- **Responsive design**: Bootstrap 5 with sidebar collapse functionality
- **Language switching**: i18next client-side language switching

## Code Style
- **ES6 modules** (`import/export`) - project uses `"type": "module"`
- **File structure**: `src/` contains config, middleware, routes, services, views, utils
- **Client-side JS**: `public/js/` contains main.js, shared.js, queues.js
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Error handling**: Try/catch blocks, middleware-based error handling
- **Config**: Environment variables via dotenv, centralized in `src/config/`
- **Services**: Class-based API services extending BaseApiService
- **Routes**: Express router modules in `src/routes/`
- **Middleware**: Separate modules for auth, security, sessions, i18n
- **Utilities**: Toast management and validation helpers in `src/utils/`
