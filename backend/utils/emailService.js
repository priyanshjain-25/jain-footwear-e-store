const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendVerificationEmail = async (email, name, code) => {
  await transporter.sendMail({
    from: `"Jain Footwear" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verify your Jain Footwear account",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to Jain Footwear</h2>
        <p>Hello ${name},</p>
        <p>Your email verification code is:</p>

        <h1 style="letter-spacing: 6px;">${code}</h1>

        <p>This code will expire in 10 minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail };