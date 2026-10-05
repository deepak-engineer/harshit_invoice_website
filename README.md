# Crons Invoice Website

This is a full-stack web application for invoice and employee management, featuring a React frontend and a monolithic Vanilla PHP backend with a MySQL database.

## Architecture & Tech Stack
- **Frontend**: React (Vite, TailwindCSS) located in `/frontend`.
- **Backend**: Vanilla PHP API located in `/invoice_backend/api`.
- **Database**: MySQL. Database connection logic is in `/invoice_backend/api/db.php`.
- **Routing**: The backend uses a monolithic routing pattern inside `index.php` where endpoints are matched using `if ($route === '.../api/...)`.

## Core Features & Authentication Flow
- **Admin Login**: Admins log in using `username` and `password`. The role is toggled in the UI.
- **Employee Login (Passwordless)**:
  1. Employees are created by the Admin (Self-signup is disabled).
  2. Employees log in using a Passwordless OTP Flow.
  3. They enter their Email Address. A request is sent to `POST /api/send-login-otp`.
  4. The backend verifies the email exists, generates a 6-digit `random_int`, hashes it, and stores it in the `email_verifications` table.
  5. The OTP is sent via HTML email using the **Resend API**.
  6. The employee enters the OTP on the frontend, hitting `POST /api/verify-login-otp`.
  7. Upon success, a long-lived session (10 years) is created for the employee.
  
## Resend API Integration
- The application uses **Resend** for sending OTP emails.
- The credentials must be placed in `/invoice_backend/.env` (which is parsed by `db.php`).
- **Required Variables**:
  - `RESEND_API_KEY`: The API key (e.g. `re_...`)
  - `RESEND_FROM_EMAIL`: The verified sender email (Use `onboarding@resend.dev` for testing, or a verified custom domain).
- The email template includes the Crons logo and is sent as HTML using PHP's `curl_init`.

## Environment Variables
- **Frontend**: Variables are in `/frontend/.env` (e.g., `VITE_GOOGLE_MAPS_API_KEY`).
- **Backend**: Variables are in `/invoice_backend/.env`. A custom loader in `db.php` parses this file and loads them into the environment using `putenv()`.

## Important Notes for Future Agents
- Do **NOT** modify the layout or CSS of the Login page. It has a strict "Do not redesign" rule from the user.
- Schema auto-migrations (like adding columns or tables) are currently handled at the very top of `index.php` to ensure they run globally before route matching.
- **Session Timeout**: The session lifetime is set to 10 years in `auth.php` as requested by the user for uninterrupted employee login.
- Be careful with `ALTER TABLE` queries on Hostinger shared hosting; wrap them in `try-catch` blocks to prevent 500 errors if columns already exist.
