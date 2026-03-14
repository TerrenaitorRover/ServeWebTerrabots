require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

// --- CORS: restrict to your frontend origin(s) ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [];

app.use(
    cors({
        origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
        methods: ["GET", "POST"],
    })
);

app.use(express.json({ limit: "16kb" }));

// --- Rate limiting: 5 emails per IP per 15 minutes ---
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Try again later." },
});

// --- Nodemailer transporter ---
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

// --- Health check for Render / UptimeRobot ---
app.get("/healthz", (_req, res) => {
    res.status(200).json({
        ok: true,
        service: "ServeWebTerrabots",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// --- Contact form endpoint ---
app.post("/send-email", contactLimiter, async (req, res) => {
    const { email, subject, message } = req.body;

    // Validate required fields
    if (!email || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: "All fields are required: email, subject, message.",
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: "Invalid email address.",
        });
    }

    // Validate field lengths
    if (subject.length > 200) {
        return res.status(400).json({
            success: false,
            error: "Subject is too long (max 200 characters).",
        });
    }
    if (message.length > 5000) {
        return res.status(400).json({
            success: false,
            error: "Message is too long (max 5000 characters).",
        });
    }

    // Escape HTML to prevent injection
    const safeMessage = message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

    const safeEmail = email
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    try {
        await transporter.sendMail({
            from: `"Terrabots Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `[Contact] ${subject}`,
            html: `
                <h3>New message from the contact form</h3>
                <p><strong>From:</strong> ${safeEmail}</p>
                <p><strong>Subject:</strong> ${subject.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                <hr>
                <p>${safeMessage}</p>
            `,
        });

        res.status(200).json({
            success: true,
            message: "Message sent successfully.",
        });
    } catch (error) {
        console.error("Email send error:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to send message. Please try again later.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
