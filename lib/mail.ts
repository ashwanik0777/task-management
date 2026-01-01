import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendTaskAssignmentEmail(
  to: string,
  taskTitle: string,
  taskDescription: string,
  deadline: Date,
  priority: string
) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("SMTP credentials not set. Skipping email.");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || '"TaskMaster" <no-reply@taskmaster.com>',
    to,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Task Assignment</h2>
        <p>Hello,</p>
        <p>You have been assigned a new task on <strong>TaskMaster</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${taskTitle}</h3>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
          <p><strong>Description:</strong></p>
          <p>${taskDescription}</p>
        </div>

        <p>Please log in to your dashboard to accept or decline this task.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/intern" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Go to Dashboard
        </a>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendOtpEmail(to: string, otp: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("SMTP credentials not set. Skipping email.");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || '"TaskMaster" <no-reply@taskmaster.com>',
    to,
    subject: `Your Verification Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verification Code</h2>
        <p>Hello,</p>
        <p>Your verification code for <strong>TaskMaster</strong> is:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="margin: 0; letter-spacing: 5px; color: #333;">${otp}</h1>
        </div>

        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
}
