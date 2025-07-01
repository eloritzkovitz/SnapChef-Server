# SnapChef API Server

The SnapChef API Server is a Node.js backend that powers the SnapChef application, providing secure REST API endpoints for user management, ingredient and recipe recognition, image uploads, and more.

## Features

- **User Authentication:** Email/password registration with OTP verification, Google sign-in, password reset, and JWT-based authentication.
- **Ingredient & Recipe Recognition:** Integrates with Google Cloud Vision to recognize ingredients from photos, receipts, and barcodes.
- **API:** Creates, updates and retrieves data for users through endpoints, divided into modules and submodules.
- **File Uploads:** Supports image uploads for ingredient recognition, recipe AI-generated images and profile pictures.
- **User Preferences:** Manages dietary, allergy, and notification preferences.
- **Friend System:** Friend requests, notifications, and recipe sharing between users.
- **Push Notifications:** Sends real-time notifications via Firebase Cloud Messaging (FCM).
- **Real-Time Updates:** Provides live user stats and notifications using WebSockets (Socket.IO).
- **Security:** Password hashing, email verification, and abuse prevention.
- **Admin & Logging:** Logs key actions and supports admin operations.

## Project Structure

- `src/` — Main application code
  - `server.ts` — Entry point
  - `modules/` — API modules (users, ingredients, recipes, etc.)
  - `utils/` — Utility functions and services
  - `jobs/` — Scheduled/maintenance scripts (e.g., cleanup)
- `dist/` — Compiled output
- `uploads/` — Stores all user-uploaded files
- `logs/` — Contains server log files
- `package.json` — Dependencies and scripts
- `tsconfig.json` — TypeScript configuration

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](https://snapchef-app.vercel.app/api)

## Notes

- The server supports cross-platform development (Windows, Mac, Linux).
- Environment variables are used for configuration and API keys.
