import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendResetEmail = async (userEmail, resetToken) => {
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: '"Translate Quran App" <labibwahid28@gmail.com>',
        to: userEmail,
        subject: "Password Reset Request",
        html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>If you didn’t request this, please ignore this email.</p>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new ApiError(500, error?.message || 'Send Email failed')
    }
    console.log("Reset email sent to:", userEmail);
};
