# MetaCore Project Change Log

This document tracks all significant changes made to the MetaCore project.

## Project Structure Overview

### Frontend (src/)
- React-based frontend application
- Key directories:
  - components/: Reusable UI components
  - pages/: Main application pages
  - services/: API integration services
  - data/: Data management
  - assets/: Static assets

### Backend (backend/)
- Python-based backend server
- Key files:
  - app.py: Main application server
  - patients.db: SQLite database
  - requirements.txt: Python dependencies
  - populate_tests.py: Test data population script

## Change Log

### [Initial Project Analysis - Current Date]
- Created changes.md file for tracking modifications
- Documented initial project structure
- No code changes made, only analysis

### [Security Enhancement - Current Date]
- Removed `/api/signup` endpoint to enforce single-user system
- This change ensures that only the admin account (admin@metacore.com) can be used
- Improves security by preventing creation of unauthorized user accounts
- Maintains the single-user requirement of the application

### [Login Error Handling Improvement - Current Date]
- Enhanced login error messages to be more specific:
  - "Invalid email address" when email is incorrect
  - "Invalid password" when password is incorrect
- This provides better feedback to users without changing the UI
- Helps users identify whether they entered the wrong email or password

### [Login Error Display Fix - Current Date]
- Fixed issue with error messages disappearing and page refreshing
- Modified API response interceptor to prevent automatic redirects on login errors
- Enhanced form submission handling in LoginPage component:
  - Added proper event propagation control
  - Implemented form validation without page refresh
  - Added visual feedback for invalid inputs
- Improved error message display:
  - Error messages now stay visible
  - Added red border highlighting for invalid fields
  - Better error message formatting and styling
- These changes provide a better user experience by:
  - Maintaining form state on error
  - Showing clear error messages
  - Preventing unwanted page refreshes
  - Providing immediate visual feedback

### [Admin Credentials Management - Current Date]
- Moved admin credentials from hardcoded values to database storage
- Updated default admin credentials:
  - Email: admin@metacore.com
  - Password: metacore@admin123
- Added new `/api/admin/update-credentials` endpoint for future admin settings
- Removed hardcoded email check in login route
- Benefits:
  - More flexible credential management
  - Foundation for future admin settings page
  - Better security through database storage
  - Ability to change credentials without code modification

### [Database Cleanup and Admin User Management - Current Date]
- Manually cleaned up database to remove old admin user
- Modified `init_user_table()` function to:
  - Remove all existing users before creating new admin
  - Ensure only one admin user exists in the database
  - Prevent duplicate admin accounts
- Benefits:
  - Cleaner database state
  - No conflicting admin accounts
  - Single source of truth for admin credentials
  - Better security through proper user management

### [Brand Name Update - Current Date]
- Updated all instances of "MedLab" to "MetaCore" across the project:
  - Updated page title in index.html
  - Updated logo alt text in LoginPage and Sidebar components
  - Updated project name in README.md and documentation
  - Updated meta description and branding
- Benefits:
  - Consistent branding across the application
  - Updated documentation to reflect new brand name
  - Improved user experience with consistent naming

--- 