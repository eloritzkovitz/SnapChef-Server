# src/

This folder contains all the main source code for the SnapChef API server. Below is an overview of each module and its purpose:

## Module Overview

- [`analytics/`](./modules/analytics/)  
  Handles analytics endpoints and logic for tracking user and app activity.

- [`cookbook/`](./modules/cookbook/)  
  Manages user cookbooks, including recipes and sharing functionality.
  - [`sharedRecipes/`]
    Submodule for handling shared recipes between users.

- [`fridge/`](./modules/fridge/)  
  Manages user fridges, including inventory and related operations.
  - [`grocery/`]
    Submodule for grocery list management and related features.

- [`ingredients/`](./modules/ingredients/)  
  Handles ingredient management, and related endpoints.
  - [`ingredientRecognition/`]
    Submodule for ingredient recognition.

- [`notifications/`](./modules/notifications/)  
  Manages push notifications, notification preferences, and delivery logic.

- [`recipes/`](./modules/recipes/)  
  Handles recipe creation, management, and search functionality.

- [`users/`](./modules/users/)  
  Manages user accounts, profiles, and preferences.
  - [`auth/`]
    Submodule for authentication, registration, OTP, and password reset.
  - [`friends/`]
    Submodule for friend requests, friend management, and sharing.

- [`utils/`](./utils/)  
  Shared utility functions and services (e.g., email, FCM, helpers).

- [`jobs/`](./jobs/)  
  Scheduled/maintenance scripts (e.g., cleanup of unverified users).

- [`server.ts`](./server.ts)  
  Application entry point.

## Notes

- This structure follows a modular, feature-based organization for scalability and maintainability.
- Each module encapsulates its own models, controllers, routes, and related logic.