# ServeWebTerrabots

Contact form backend for the Terrabots rover website. Receives form submissions and delivers them to the lab inbox via Gmail SMTP.

## Endpoints

- **POST /send-email** — receives `{ email, subject, message }` and sends it to the lab inbox with the sender's email as `replyTo`
- **GET /healthz** — health check for Render / UptimeRobot

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file from the template:
   ```bash
   cp example.env .env
   ```

3. Fill in the environment variables:
   - `EMAIL_USER` — Gmail address (lab inbox)
   - `EMAIL_PASS` — Gmail App Password ([how to create one](https://support.google.com/accounts/answer/185833))
   - `ALLOWED_ORIGINS` — comma-separated frontend origins (e.g. `https://terrabots.com,https://www.terrabots.com`)

4. Run:
   ```bash
   npm start
   ```

## Deployment (Render)

- **Build command:** `npm install`
- **Start command:** `npm start`
- **Environment variables:** set `EMAIL_USER`, `EMAIL_PASS`, and `ALLOWED_ORIGINS` in the Render dashboard. `PORT` is injected automatically by Render.

## Frontend Integration

```js
const res = await fetch("https://servewebterrabots.onrender.com/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subject, message }),
});
const data = await res.json();
// data.success === true | false
// data.message or data.error
```
