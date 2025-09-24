import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {

    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Project Management',
            link: 'https://www.projectmanagement.js/'
        }
    })

    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtml = mailGenerator.generate(options.mailgenContent);

// Looking to send emails in production? Check out our Email API/SMTP product!
const transport = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: process.env.MAILTRAP_SMTP_PORT,
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASS
  }
});

const mail = {
    from :"mail.projectmanagement@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHtml
}
try {
    await transport.sendMail(mail);
} catch (error) {
    console.log("Email service failed siliently. Make sure that you have provised your MAILTRAP_SMTP_USER and MAILTRAP_SMTP_PASS environment variables. ");
    console.log("Error:",error);
}
};
 
const emailVerificationMailgen = (username,verificationUrl) =>{
    return {
        body:{
            name:username,
            intro: 'Welcome to Project Management! We\'re very excited to have you on board.',
            action: {
                instructions: 'To get started with Project Management, please click here:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Confirm your email',
                    link: verificationUrl
                },
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    },
};
};
const forgotPasswordMailgen = (username,passwordResetUrl) =>{
    return {
        body:{
            name:username,
            intro: 'Forgot your password? No problem! Just click the button below to reset it.',
            action: {
                instructions: 'To reset your password, please click here:',
                button: {
                    color: '#c62222ff',
                    text: 'Reset your password',
                    link: passwordResetUrl
                },
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    },
};
};

export { emailVerificationMailgen, forgotPasswordMailgen , sendEmail};