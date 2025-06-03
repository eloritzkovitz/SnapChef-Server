# Architecture Overview

This document provides a high-level overview of the SnapChef API server's architecture, design patterns, and major components.

## Architectural Pattern

The SnapChef API server follows a **modular MVC (Model-View-Controller)** pattern for clear separation of concerns and maintainability:

- **Model:** Mongoose schemas and models representing data structures (e.g., User, Recipe, Ingredient).
- **Controller:** Business logic and request handling for each API endpoint.
- **Routes (View):** Express route definitions that map HTTP requests to controllers.

## Main Layers & Responsibilities

| Layer         | Responsibilities                                                                 |
|---------------|----------------------------------------------------------------------------------|
| **Models**    | Mongoose schemas and models for MongoDB collections.                             |
| **Controllers**| Handle business logic, validation, and API responses.                           |
| **Routes**    | Define API endpoints and route requests to controllers.                          |
| **Services/Utils** | Utility functions, integrations (e.g., email, FCM, Google APIs), helpers.   |
| **Jobs**      | Scheduled scripts for maintenance tasks (e.g., cleanup of unverified users).     |
| **Middleware**| Authentication, error handling, and request preprocessing.                       |
| **Config**    | Environment variables and configuration files.                                   |

## Data Flow

1. **Client sends an HTTP request to an API endpoint.**
2. **Route** receives the request and forwards it to the appropriate **Controller**.
3. **Controller** processes the request, interacts with **Models** and **Services/Utils** as needed.
4. **Model** handles database operations (CRUD) via Mongoose.
5. **Controller** sends a response back to the client.

## Third-party Integrations

- **Google Cloud Vision:** Ingredient recognition.
- **Generative AI:** Recipe generation.
- **Vertex AI + Stable Diffusion:** Recipe image generation.
- **Firebase Cloud Messaging (FCM):** Push notifications.
- **MongoDB:** Main database for persistent storage.
- **Nodemailer:** Email sending for OTP and password reset.

## State Management

- Stateless: Each API request is independent.
- User authentication is managed via JWT tokens.
- User session state is not stored on the server.

## Folder Structure

See [`src/README.md`](/src/README.md) or the main project README for a detailed breakdown of the source code organization.

## Further Reading

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MVC Pattern in Node.js](https://www.geeksforgeeks.org/model-view-controllermvc-architecture-for-node-applications/)
- [REST API Design](https://restfulapi.net/)