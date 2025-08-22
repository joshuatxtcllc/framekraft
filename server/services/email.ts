// Simple email service for authentication emails
// This is a placeholder - in production, use a service like SendGrid, AWS SES, or Nodemailer

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, from = process.env.EMAIL_FROM || 'noreply@framekraft.com' } = options;
  
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:');
    console.log(`  From: ${from}`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Preview: ${html.substring(0, 200)}...`);
    return;
  }
  
  // In production, you would integrate with an email service here
  // Example with nodemailer:
  /*
  import nodemailer from 'nodemailer';
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });
  */
  
  console.log(`Email sent to ${to}: ${subject}`);
}

export default { sendEmail };