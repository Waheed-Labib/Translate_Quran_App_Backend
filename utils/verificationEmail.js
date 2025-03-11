import { ApiError } from "./ApiError.js";
import { transporter } from "./transporter.js";

export const sendVerficationEmail = async (userEmail, encodedVerificationToken) => {
    const verificationLink = `http://localhost:3000/api/v1/users/verify-email?token=${encodedVerificationToken}`;

    const mailOptions = {
        from: '"Translate Quran App" <labibwahid28@gmail.com>',
        to: userEmail,
        subject: "Email Verification",
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new ApiError(500, error?.message || 'Send Email failed')
    }
    console.log("Verification email sent to:", userEmail);
};
