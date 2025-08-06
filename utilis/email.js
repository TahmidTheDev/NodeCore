// utils/email.js (or wherever you place it)

import nodemailer from 'nodemailer';

export default class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Tahmid <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Use SendGrid in production
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // Use Mailtrap or SMTP in development
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Send a plain-text email (no pug templates)
  async send(subject, message) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: message,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    const message = `Hi ${this.firstName},\n\nWelcome to our application! We're excited to have you.\nVisit your dashboard here: ${this.url}\n\nCheers,\nThe Team`;
    await this.send('Welcome to Our App!', message);
  }

  async sendPasswordReset() {
    const message = `Hi ${this.firstName},\n\nYou requested a password reset.\nClick here to reset your password: ${this.url}\n\nThis link will expire in 10 minutes.\nIf you didn't request this, please ignore this email.`;
    await this.send(
      'Your password reset token (valid for 10 minutes)',
      message
    );
  }
}

// import nodemailer from 'nodemailer';

// const sendEmail = async ({ email, subject, message }) => {
//   //create transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   //2) Define mail option
//   const mailOptions = {
//     from: '"Tahmid" <languagepython007@gmail.com>',
//     to: email,
//     subject,
//     text: message,
//   };
//   //3)Actually send the email
//   await transporter.sendMail(mailOptions);
// };
// export default sendEmail;
