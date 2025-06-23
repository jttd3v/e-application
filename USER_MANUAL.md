# User Manual

This web application allows applicants to fill out a multi‑page form for Cebu Ace-Maritime International Inc. using their preferred layout. Data is stored in your browser so you can continue later.

## 1. Starting the Application

1. Install dependencies with `npm install`.
2. Set your Gemini API key in `.env.local` as `GEMINI_API_KEY`.
3. Run `npm run dev` and open `http://localhost:5173` in a browser.

## 2. Personal Information Form

- Located at `index.html`.
- Enter your basic information, contact details and emergency contact.
- Upload a photo to include in the application.
- Add up to five children using the **Add Child** button.
- Information is saved automatically to local storage under the key `mainApplicationFormData`.
- Click **Next Page** to proceed to the Sea Experience form.

## 3. Sea Experience Form

- Located at `camiip2.html` and loaded after clicking **Next Page**.
- Use **Add Another Experience** to enter up to fifteen sea service records.
- Each block requires details such as rank, vessel name, ship type and service dates.
- A progress bar shows completion based on filled fields.
- Use **Preview & Print Summary** for a printable table of all experience entries.
- Use **Back to Personal Info** to return to the first page.
- Form data is stored in local storage under `seaExperienceFormData_v2`.

## 4. Submission

- Press **Submit & Email** to send the form data to `submit_application.php`. This script uses **PHPMailer** to email your application via SMTP.
- Ensure you review your information using the print preview before submitting.

## 5. Clearing Stored Data

To clear saved data, use the browser’s local storage controls or manually remove the keys above.
