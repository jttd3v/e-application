# e-application

This project contains a client-side form for collecting sea experience data. A small Node.js server is provided to handle submissions so that multiple users can submit the form without interfering with each other. Each submission is stored as a separate file on the server.

## Running the Server

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
   The form is served at `http://localhost:3000/e-app-202506040528.html`.

Submitted data will be saved in the `submissions/` directory with a unique timestamped filename. In addition, a PDF copy of each submission is generated and emailed to the address defined in your environment variables using Nodemailer.

### Email Configuration

Set the following environment variables before starting the server:

```
EMAIL_HOST   - SMTP host
EMAIL_PORT   - SMTP port (e.g. 587)
EMAIL_SECURE - 'true' for secure (TLS) connection
EMAIL_USER   - SMTP username
EMAIL_PASS   - SMTP password
EMAIL_FROM   - Sender address
EMAIL_TO     - Recipient address
```
