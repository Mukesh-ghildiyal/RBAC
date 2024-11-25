const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER || "",
        pass: process.env.MAILTRAP_PASSWORD || "",
    }
});


const sendMail = async (email, subject, content) => {

    try {

        var mailOptions = {
            from: process.env.MAILTRAP_SENDER_EMAIL || "muku7354@gmail.com",
            to: email,
            subject: subject,
            html: content
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email} with subject "${subject}". Message ID: ${info.messageId}`);

        return true; // Indicate success
    } catch (error) {
        console.error(`Failed to send email to ${email}: ${error.message}`);
        return false; // Indicate failure
    }
};


module.exports = {
    sendMail
}



