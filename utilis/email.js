import nodemailer from 'nodemailer';

const sendEmail = async ({ email, subject, message }) => {
  //create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  //2) Define mail option
  const mailOptions = {
    from: '"Tahmid" <languagepython007@gmail.com>',
    to: email,
    subject,
    text: message,
  };
  //3)Actually send the email
  await transporter.sendMail(mailOptions);
};
export default sendEmail;
