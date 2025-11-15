'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const emailTemplates = {
  bookingConfirmation: (data: {
    customerName: string;
    storeName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
    petName: string;
    totalAmount: string;
  }) => ({
    subject: `✅ Booking Confirmed - ${data.storeName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #374151; font-size: 16px;">Hi ${data.customerName},</p>
          
          <p style="color: #6b7280;">Your appointment has been successfully booked at <strong style="color: #667eea;">${data.storeName}</strong>.</p>
          
          <div style="background: #f3f4f6; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <h2 style="margin-top: 0; color: #1f2937;">Appointment Details</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Pet:</strong> ${data.petName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${data.bookingDate}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${data.bookingTime}</p>
            <p style="margin: 8px 0; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 18px;">
              <strong>Total: ₹${data.totalAmount}</strong>
            </p>
          </div>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #1e40af;">📌 Important</h3>
            <p style="color: #1e3a8a; margin: 0;">Please arrive 10 minutes before your appointment. If you need to reschedule, please contact us as soon as possible.</p>
          </div>
          
          <p style="color: #9ca3af; margin-top: 30px;">Thank you for booking with ${data.storeName}! We look forward to seeing you and your pet.</p>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
            If you have any questions, please contact us or reply to this email.
          </p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">${data.storeName} © 2025. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  bookingConfirmed: (data: {
    customerName: string;
    storeName: string;
    serviceName: string;
    bookingDate: string;
    bookingTime: string;
  }) => ({
    subject: `✅ Your Appointment is Confirmed - ${data.storeName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Appointment Confirmed!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px;">Hi ${data.customerName},</p>
          
          <p style="color: #6b7280;">Great news! Your appointment has been confirmed by ${data.storeName}.</p>
          
          <div style="background: white; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${data.bookingDate}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${data.bookingTime}</p>
          </div>
          
          <p style="color: #6b7280;">See you soon! 🎉</p>
        </div>
      </div>
    `,
  }),

  bookingCanceled: (data: {
    customerName: string;
    storeName: string;
    serviceName: string;
    bookingDate: string;
    reason?: string;
  }) => ({
    subject: `❌ Appointment Canceled - ${data.storeName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">❌ Appointment Canceled</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px;">Hi ${data.customerName},</p>
          
          <p style="color: #6b7280;">Your appointment has been canceled.</p>
          
          <div style="background: white; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>Service:</strong> ${data.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${data.bookingDate}</p>
            ${data.reason ? `<p style="margin: 8px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          
          <p style="color: #6b7280;">If you'd like to reschedule, please contact us or book a new appointment.</p>
        </div>
      </div>
    `,
  }),

  couponOffer: (data: {
    customerName: string;
    storeName: string;
    couponCode: string;
    discount: string;
    expiryDate: string;
  }) => ({
    subject: `🎉 Special Offer: ${data.discount} Off! - ${data.storeName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Special Offer!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Get ${data.discount} Off</p>
        </div>
        
        <div style="background: #f9fafb; padding: 40px 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px;">Hi ${data.customerName},</p>
          
          <p style="color: #6b7280; margin: 20px 0;">We have an exclusive offer just for you at ${data.storeName}!</p>
          
          <div style="background: white; border: 3px dashed #f59e0b; padding: 30px; margin: 30px 0; border-radius: 8px;">
            <p style="color: #6b7280; margin: 0 0 10px 0;">Use coupon code:</p>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f59e0b; font-family: monospace; letter-spacing: 2px;">
              ${data.couponCode}
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">Valid until ${data.expiryDate}</p>
          </div>
          
          <a href="#" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Claim Offer
          </a>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Don't miss out! This offer is valid until ${data.expiryDate}.
          </p>
        </div>
      </div>
    `,
  }),

  newServiceAnnouncement: (data: {
    customerName: string;
    storeName: string;
    serviceName: string;
    serviceDescription: string;
    servicePrice: string;
  }) => ({
    subject: `🎉 New Service Available - ${data.serviceName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✨ New Service Alert!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px;">Hi ${data.customerName},</p>
          
          <p style="color: #6b7280;">We're excited to announce a new service at ${data.storeName}!</p>
          
          <div style="background: white; border: 2px solid #667eea; padding: 25px; margin: 25px 0; border-radius: 8px;">
            <h2 style="margin: 0 0 15px 0; color: #667eea; font-size: 22px;">${data.serviceName}</h2>
            <p style="color: #6b7280; margin: 0 0 15px 0; line-height: 1.6;">${data.serviceDescription}</p>
            <p style="color: #667eea; font-size: 24px; font-weight: bold; margin: 0;">₹${data.servicePrice}</p>
          </div>
          
          <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Book Now
          </a>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Limited time offer! Book your appointment today.
          </p>
        </div>
      </div>
    `,
  }),
};

// Send email function
export async function sendEmailNotification(
  type: keyof typeof emailTemplates,
  to: string,
  data: any
) {
  try {
    const template = emailTemplates[type](data);

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✅ Email sent to ${to}: ${type}`);
    return { success: true, result };
  } catch (error) {
    console.error(`❌ Failed to send email (${type}):`, error);
    return { success: false, error };
  }
}
