import SibApiV3Sdk from '@sendinblue/client';
import ical from 'ical-generator';
import { formatDate } from '../utils/timezone.js';

class EmailCalendarService {
  constructor() {
    this.apiInstance = null;
    this.initialized = false;
  }

  
  initialize() {
    try {
      const brevoApiKey = process.env.BREVO_API_KEY;
      const emailFrom = process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL;
      const senderName = process.env.BREVO_SENDER_NAME || 'Psychology Portal';

      console.log('Initializing Email Calendar Service with Brevo API:', {
        hasApiKey: !!brevoApiKey,
        from: emailFrom,
        senderName: senderName,
        nodeEnv: process.env.NODE_ENV
      });

      if (!brevoApiKey || !emailFrom) {
        console.warn('Email Calendar Service: Missing Brevo credentials. Calendar invites will not be sent.');
        return false;
      }

      // Initialize Brevo API
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      this.apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

      this.emailFrom = emailFrom;
      this.senderName = senderName;
      this.initialized = true;

      console.log('Email Calendar Service initialized successfully with Brevo API');
      return true;
    } catch (error) {
      console.error('Failed to initialize Email Calendar Service:', error.message);
      return false;
    }
  }


  async sendCalendarInvite(eventData) {
    if (!this.initialized) {
      const success = this.initialize();
      if (!success) {
        throw new Error('Email Calendar Service is not initialized. Check email credentials.');
      }
    }

    try {
      const {
        to,
        subject,
        eventTitle,
        eventDescription,
        startTime,
        endTime,
        location,
        timezone,
        formattedDate,
        formattedTime
      } = eventData;

      const calendar = ical({ name: 'Psychology Portal - Session Booking' });

      calendar.createEvent({
        start: startTime,
        end: endTime,
        summary: eventTitle,
        description: eventDescription,
        location: location || '',
        url: location, 
        organizer: {
          name: 'Psychology Portal',
          email: this.emailFrom
        },
        method: 'REQUEST',
        status: 'CONFIRMED'
      });

      const icsContent = calendar.toString();

      const recipients = Array.isArray(to) ? to.join(', ') : to;

      const displayDateTime = (formattedDate && formattedTime) 
        ? `${formattedDate} at ${formattedTime}`
        : formatDate(startTime);
      const durationMinutes = Math.round((new Date(endTime) - new Date(startTime)) / 60000);

      // Email HTML body
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .details { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            .timezone-note { font-size: 12px; color: #666; font-style: italic; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗓️ Therapy Session Scheduled</h1>
            </div>
            <div class="content">
              <h2>${eventTitle}</h2>
              <p>Your therapy session has been scheduled. Please find the details below:</p>

              <div class="details">
                <p><strong>📅 Date & Time:</strong><br>${displayDateTime}<br><span class="timezone-note"></span></p>
                <p><strong>⏱️ Duration:</strong><br>${durationMinutes} minutes</p>
                ${eventDescription ? `<p><strong>📝 Notes:</strong><br>${eventDescription}</p>` : ''}
              </div>

              ${location ? `
                <p><strong>Join via Zoom:</strong></p>
                <a href="${location}" class="button">Join Zoom Meeting</a>
                <p style="font-size: 14px; color: #666;">Or copy and paste this link: <br><a href="${location}">${location}</a></p>
              ` : ''}

              <p><strong>📎 Calendar Invite:</strong><br>This email includes a calendar invitation (.ics file) that you can add to your calendar app (Google Calendar, Outlook, Apple Calendar, etc.).</p>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">If you need to reschedule or cancel, please contact us as soon as possible.</p>
            </div>
            <div class="footer">
              <p>Psychology Portal - Your Mental Wellness Partner</p>
              <p class="timezone-note">Times shown in UTC. They will display in your local timezone when added to your calendar.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Prepare recipients for Brevo API
      const recipientList = Array.isArray(to) ? to : [to];
      const toRecipients = recipientList.map(email => ({ email: email.trim() }));

      // Send email using Brevo API with .ics attachment
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: this.senderName, email: this.emailFrom };
      sendSmtpEmail.to = toRecipients;
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlBody;
      sendSmtpEmail.attachment = [
        {
          name: 'session-invite.ics',
          content: Buffer.from(icsContent).toString('base64')
        }
      ];

      console.log('Attempting to send email via Brevo API to:', recipientList.join(', '));
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Email sent successfully via Brevo:', response.body?.messageId || response.messageId);

      return {
        success: true,
        messageId: response.body?.messageId || response.messageId,
        recipients: recipientList.join(', ')
      };
    } catch (error) {
      console.error('Error sending calendar invite:', error.message);
      throw new Error(`Failed to send calendar invite: ${error.message}`);
    }
  }

  
  async sendCancellationEmail(eventData) {
    if (!this.initialized) {
      const success = this.initialize();
      if (!success) {
        throw new Error('Email Calendar Service is not initialized. Check email credentials.');
      }
    }

    try {
      const {
        to,
        subject,
        eventTitle,
        startTime,
        reason,
        canceledBy,
        canceledByName,
        // Pre-formatted strings for display
        formattedDate,
        formattedTime
      } = eventData;

      const recipients = Array.isArray(to) ? to.join(', ') : to;

      // Use pre-formatted date/time if provided
      const displayDateTime = (formattedDate && formattedTime) 
        ? `${formattedDate} at ${formattedTime}`
        : formatDate(startTime);

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
            .timezone-note { font-size: 12px; color: #666; font-style: italic; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Session Cancelled</h1>
            </div>
            <div class="content">
              <h2>${eventTitle}</h2>
              <p>The therapy session scheduled for <strong>${displayDateTime}</strong> <span class="timezone-note">(Eastern Time)</span> has been cancelled.</p>

              ${canceledByName ? `<p><strong>Cancelled by:</strong> ${canceledByName} ${canceledBy ? `(${canceledBy === 'psychologist' ? 'Psychologist' : 'Client'})` : ''}</p>` : ''}
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

              <p style="margin-top: 30px;">If you'd like to reschedule, please contact us or book a new session through the portal.</p>
            </div>
            <div class="footer">
              <p>Psychology Portal - Your Mental Wellness Partner</p>
              <p class="timezone-note">Times shown in UTC. They will display in your local timezone when added to your calendar.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Prepare recipients for Brevo API
      const recipientList = Array.isArray(to) ? to : [to];
      const toRecipients = recipientList.map(email => ({ email: email.trim() }));

      // Send email using Brevo API
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: this.senderName, email: this.emailFrom };
      sendSmtpEmail.to = toRecipients;
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlBody;

      console.log('Attempting to send cancellation email via Brevo API to:', recipientList.join(', '));
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Cancellation email sent successfully via Brevo:', response.body?.messageId || response.messageId);

      return {
        success: true,
        messageId: response.body?.messageId || response.messageId,
        recipients: recipientList.join(', ')
      };
    } catch (error) {
      console.error('Error sending cancellation email:', error.message);
      throw new Error(`Failed to send cancellation email: ${error.message}`);
    }
  }

  
  isAvailable() {
    return this.initialized || this.initialize();
  }
}

const emailCalendarService = new EmailCalendarService();
export default emailCalendarService;
