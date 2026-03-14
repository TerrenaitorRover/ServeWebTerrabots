require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(express.json());
app.use(cors());

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // lo dejas como tú quieres
    },
});

// Endpoint de salud para Render/UptimeRobot
app.get("/healthz", (req, res) => {
    res.status(200).json({
        ok: true,
        service: "ServeWebTerrabots",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Endpoint para enviar correos
app.post("/send-email", async (req, res) => {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: `<p>${message}</p>`,
        });

        res.status(200).json({ success: true, message: "Correo enviado con éxito" });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ success: false, error: "Error al enviar el correo" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
