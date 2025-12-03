const nodemailer = require('nodemailer');

let transporter = null;

// Create transporter lazily to ensure env vars are loaded
function getTransporter() {
    if (!transporter) {
        if (!process.env.SMTP_HOST) {
            console.warn('WARNING: SMTP_HOST is not defined. Emails will not be sent.');
        }

        // Debug: Log SMTP configuration (mask password)
        console.log('📧 Creating SMTP transporter with config:',{
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'
        });

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: process.env.SMTP_SECURE === 'true' || true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify transporter configuration
        transporter.verify((error,success) => {
            if (error) {
                console.error('❌ SMTP Transporter verification failed:',error);
            } else {
                console.log('✅ SMTP Server is ready to send emails');
            }
        });
    }
    return transporter;
}

const templates = {
    verification: (token) => ({
        subject: 'Verify your email - Expense Tracker',
        text: `Welcome to Expense Tracker!\n\nPlease verify your email address by clicking the link below:\n\n${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}\n\nThis link will expire in 30 minutes.\n\nIf you did not create an account, please ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Welcome to Expense Tracker</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Verify Email
                </a>
                <p style="color: #666;">This link will expire in 30 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you did not create an account, please ignore this email.</p>
            </div>
        `,
    }),
    invite_received: (payload) => ({
        subject: `You were invited to join ${payload.collabName} - Expense Tracker`,
        text: `Collaboration Invitation\n\n${payload.inviterName} has invited you to join the collaboration "${payload.collabName}".\n\nView your invitation at: ${process.env.FRONTEND_URL}/collaborations`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Collaboration Invitation</h1>
                <p>${payload.inviterName} has invited you to join the collaboration "${payload.collabName}".</p>
                <a href="${process.env.FRONTEND_URL}/collaborations" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Invitation
                </a>
            </div>
        `,
    }),
    invite_response: (payload) => ({
        subject: `Invitation ${payload.status} - Expense Tracker`,
        text: `Invitation Update\n\n${payload.userName} has ${payload.status} your invitation to "${payload.collabName}".\n\nView collaboration at: ${process.env.FRONTEND_URL}/collaborations`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Invitation Update</h1>
                <p>${payload.userName} has ${payload.status} your invitation to "${payload.collabName}".</p>
                <a href="${process.env.FRONTEND_URL}/collaborations" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Collaboration
                </a>
            </div>
        `,
    }),
    settlement_request: (payload) => ({
        subject: `Settlement Requested: ₹${payload.amount} - Expense Tracker`,
        text: `Settlement Request\n\n${payload.requesterName} has requested a settlement of ₹${payload.amount}.\n\nView request at: ${process.env.FRONTEND_URL}/collaborations/${payload.collabId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Settlement Request</h1>
                <p>${payload.requesterName} has requested a settlement of ₹${payload.amount}.</p>
                <a href="${process.env.FRONTEND_URL}/collaborations/${payload.collabId}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Request
                </a>
            </div>
        `,
    }),
    settlement_response: (payload) => ({
        subject: `Settlement ${payload.status} - Expense Tracker`,
        text: `Settlement Update\n\nYour settlement request has been ${payload.status}.\n\nView details at: ${process.env.FRONTEND_URL}/collaborations/${payload.collabId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Settlement Update</h1>
                <p>Your settlement request has been ${payload.status}.</p>
                <a href="${process.env.FRONTEND_URL}/collaborations/${payload.collabId}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Details
                </a>
            </div>
        `,
    }),
    settlement_paid: (payload) => ({
        subject: `Payment Received: ₹${payload.amount} - Expense Tracker`,
        text: `Payment Received\n\nYou have received a payment of ₹${payload.amount} from ${payload.payerName}.\n\nView details at: ${process.env.FRONTEND_URL}/collaborations/${payload.collabId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Payment Received</h1>
                <p>You have received a payment of ₹${payload.amount} from ${payload.payerName}.</p>
                <a href="${process.env.FRONTEND_URL}/collaborations/${payload.collabId}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Details
                </a>
            </div>
        `,
    }),
    goal_status: (payload) => ({
        subject: payload.reached ? `🎉 Goal Achieved: ${payload.goalName}! - Expense Tracker` : `⚠ Goal Not Reached: ${payload.goalName} - Expense Tracker`,
        text: `Goal Update\n\n${payload.reached ? 'Congratulations! You have achieved your goal.' : 'You have not reached your goal yet.'}\n\nGoal: ${payload.goalName}\n\nView dashboard at: ${process.env.FRONTEND_URL}/dashboard`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Goal Update</h1>
                <p>${payload.reached ? 'Congratulations! You have achieved your goal.' : 'You have not reached your goal yet.'}</p>
                <p><strong>Goal:</strong> ${payload.goalName}</p>
                <a href="${process.env.FRONTEND_URL}/dashboard" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    View Dashboard
                </a>
            </div>
        `,
    }),
};

const sendEmail = async (to,type,payload) => {
    try {
        const templateFn = templates[type];
        if (!templateFn) {
            throw new Error(`Invalid email type: ${type}`);
        }

        const { subject,text,html } = templateFn(payload);

        const mailOptions = {
            from: process.env.SMTP_FROM || `"Expense Tracker" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        };

        console.log(`📧 Sending email to ${to} - Type: ${type}`);
        const info = await getTransporter().sendMail(mailOptions);
        console.log('✅ Email sent successfully:',info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:',error);
        console.error('Error details:',{
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
        });
        throw error;
    }
};

module.exports = { sendEmail };
