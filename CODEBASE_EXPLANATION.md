# CodeTrack - Codebase Explanation

## Overview

CodeTrack is a web application designed to help users track and compare their coding progress across multiple platforms (LeetCode, CodeForces, and GeeksForGeeks). The application allows users to:

1. Create an account and manage their profile
2. Link their profiles from supported coding platforms
3. View their coding progress and statistics in a comprehensive dashboard
4. Compare their progress with other users
5. Create and manage custom lists of coding problems
6. Track their search history when comparing with other users

## Technology Stack

### Frontend
- **React 18** with **TypeScript** for type-safe component development
- **TailwindCSS** for styling and responsive design
- **Shadcn/UI** for consistent UI components
- **TanStack Query (React Query)** for server state management
- **Recharts** for data visualization and charts
- **Wouter** for client-side routing
- **React Hook Form** with **Zod** for form validation

### Backend
- **Express.js** server for handling API requests
- **Passport.js** with session-based authentication
- **In-memory storage** for data persistence (for this implementation)
- **Mock API integrations** for platform data fetching (simulated)

### Shared
- **Drizzle ORM** with **PostgreSQL** schema definitions
- **Zod** for schema validation

## Project Structure

### Frontend (client/src)

- **components/**
  - **ui/**: Shadcn UI components
  - **dashboard/**: Dashboard-specific components
  - **compare/**: Comparison feature components
  - **lists/**: Question list management components
  - **profile/**: User profile components
  - **layout/**: Layout components (Header, Sidebar)

- **hooks/**
  - **use-auth.tsx**: Authentication context and hooks
  - **use-toast.ts**: Toast notification hook

- **lib/**
  - **queryClient.ts**: TanStack Query setup and utility functions
  - **utils.ts**: Utility functions
  - **protected-route.tsx**: Route protection for authenticated routes

- **pages/**
  - **home-page.tsx**: Landing page
  - **auth-page.tsx**: Login and registration
  - **dashboard-page.tsx**: User dashboard
  - **compare-page.tsx**: Profile comparison
  - **profile-page.tsx**: User profile management
  - **lists-page.tsx**: Question list management
  - **not-found.tsx**: 404 page

### Backend (server)

- **auth.ts**: Authentication setup with Passport.js
- **routes.ts**: API route definitions
- **storage.ts**: In-memory data storage implementation
- **platforms/**: Platform-specific data fetching modules
  - **leetcode.ts**: LeetCode API integration
  - **codeforces.ts**: CodeForces API integration
  - **geeksforgeeks.ts**: GeeksForGeeks web scraping

### Shared (shared)

- **schema.ts**: Database schema and type definitions

## Data Flow

### User Authentication (Login/Register)

1. User enters credentials on the `/auth` page
2. Frontend calls `loginMutation` or `registerMutation` from `useAuth` hook
3. Request sent to `/api/login` or `/api/register` endpoints
4. Backend validates credentials and creates a session
5. Frontend updates auth context with user data
6. User is redirected to dashboard

### Fetching Platform Data

1. User links platform accounts in profile page
2. Upon dashboard load, React Query fetches data based on linked accounts
3. Frontend calls `/api/fetch/leetcode/{username}`, etc.
4. Backend calls respective platform APIs/scraping functions
5. Data is returned to frontend and displayed in dashboard charts and stats

### User Comparison

1. User enters usernames to compare on the compare page
2. Frontend calls `compareMutation` which POSTs to `/api/compare`
3. Backend fetches data for each platform and username
4. If user is logged in, backend also adds search entries to history
5. Results are returned to frontend and displayed in charts

### Custom List Management

1. User creates a list via the lists page
2. Frontend sends data to `/api/questions/create_list`
3. Backend creates list in storage
4. User adds questions to list
5. Frontend sends data to `/api/questions/add_question`
6. User marks questions as solved/unsolved
7. Frontend updates via `/api/questions/list/{listId}/mark_solved/{questionId}`

### Profile Updates & Search History

1. User updates platform usernames in profile page
2. Frontend calls `updateProfileMutation` to `/api/profile/update-links`
3. Backend updates user record
4. When viewing search history, frontend fetches from `/api/profile/search-history`
5. Backend returns unique search entries made by user

## Key Components/Functions

- **AuthProvider/useAuth**: Central authentication context that manages user state and auth operations
- **PlatformCard**: Displays platform-specific data in a card format
- **ComparisonForm/ComparisonResults**: Handles user comparison input and results visualization
- **CreateListDialog/AddQuestionDialog**: Manages question list creation and population
- **PlatformLinking**: Manages user platform profile connections
- **fetchLeetcodeData/fetchCodeforcesData/fetchGFGData**: Backend functions for platform data retrieval
- **MemStorage**: In-memory implementation of the storage interface

## Database Models

- **User**: User account information and platform connections
- **QuestionList**: Custom question lists created by users
- **Question**: Individual questions added to lists
- **SearchHistory**: Record of profiles searched by users

## API Endpoints

- **/api/auth/register, /api/auth/login, /api/auth/logout**: Authentication
- **/api/user**: Get current user data
- **/api/profile/update-links**: Update linked platform usernames
- **/api/profile/search-history**: Get user's search history
- **/api/fetch/{platform}/{username}**: Fetch platform-specific data
- **/api/compare**: Compare multiple users across platforms
- **/api/questions/create_list, /api/questions/lists**: List management
- **/api/questions/add_question, /api/questions/list/{id}**: Question management
- **/api/questions/list/{id}/mark_solved/{questionId}**: Mark questions as solved

## Setup/Running Instructions

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Access the application at `http://localhost:5000`

The application includes both client and server which will be started together. All API endpoints are available at the same origin to avoid CORS issues.
