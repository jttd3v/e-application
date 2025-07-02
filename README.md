# E-Application for CAMII

This project collects applicant information for Cebu Ace-Maritime International Inc. The front end is a Vite based form written in TypeScript. Submitted data is saved to a MySQL database and emailed via PHPMailer.

## Prerequisites

- [XAMPP](https://www.apachefriends.org) with PHP 8 and MySQL
- Node.js 18+
- Composer

## Setup

1. Copy `.env.example` to `.env` and provide SMTP and database credentials.
2. Create a MySQL database (default name `camii_app`). Example schema:

   ```sql
   CREATE TABLE applications (
     id INT AUTO_INCREMENT PRIMARY KEY,
     personal LONGTEXT,
     experiences LONGTEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
3. Place this project inside XAMPP's `htdocs` directory or configure a virtual host.
4. Start Apache and MySQL from the XAMPP control panel.
5. Install PHP dependencies with `composer install`.
6. Install Node dependencies with `npm install` and start the dev server using `npm run dev`.

## Usage

- Open `http://localhost:5173` to fill out the forms.
- The **Submit & Email** button sends data to `submit_application.php`. The script saves the submission in MySQL and emails a copy via SMTP.

Use `npm run build` to create a production build and `npm run preview` to serve the built files.

## Repository Structure

- `index.html` / `index.tsx` – personal information form
- `camiip2.html` – sea experience form
- `submit_application.php` – handles email and database storage
- `USER_MANUAL.md` – detailed usage instructions

For form navigation and data persistence details see [USER_MANUAL.md](USER_MANUAL.md).
