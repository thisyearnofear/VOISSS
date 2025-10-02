import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, subject, message }: ContactFormData = await request.json();
    
    // Validate required fields
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Create support ticket data
    const supportTicket = {
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      status: 'open',
      priority: 'normal',
    };
    
    // In production, you would:
    // 1. Store in database
    // 2. Send email notification to support team
    // 3. Send auto-reply to user
    // 4. Create ticket in support system (Zendesk, Freshdesk, etc.)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Support Ticket Created:', supportTicket);
    }
    
    // Example: Send email notification (you would use a service like SendGrid, Resend, etc.)
    if (process.env.SUPPORT_EMAIL && process.env.NODE_ENV === 'production') {
      await sendSupportNotification(supportTicket);
    }
    
    // Example: Send auto-reply to user
    if (process.env.NODE_ENV === 'production') {
      await sendAutoReply(email, subject);
    }
    
    return NextResponse.json(
      { 
        message: 'Support request submitted successfully',
        ticketId: generateTicketId()
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    );
  }
}

// Helper function to generate ticket ID
function generateTicketId(): string {
  return 'VOISSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Helper function to send support notification (example)
async function sendSupportNotification(ticket: any) {
  // Example implementation with a service like Resend or SendGrid
  // const emailService = new EmailService();
  // await emailService.send({
  //   to: process.env.SUPPORT_EMAIL,
  //   subject: `New Support Request: ${ticket.subject}`,
  //   html: `
  //     <h2>New Support Request</h2>
  //     <p><strong>From:</strong> ${ticket.email}</p>
  //     <p><strong>Subject:</strong> ${ticket.subject}</p>
  //     <p><strong>Message:</strong></p>
  //     <p>${ticket.message}</p>
  //     <p><strong>Timestamp:</strong> ${ticket.timestamp}</p>
  //   `
  // });
}

// Helper function to send auto-reply (example)
async function sendAutoReply(email: string, subject: string) {
  // Example implementation
  // const emailService = new EmailService();
  // await emailService.send({
  //   to: email,
  //   subject: `Re: ${subject} - We've received your message`,
  //   html: `
  //     <h2>Thank you for contacting VOISSS Support</h2>
  //     <p>We've received your message and will get back to you within 24 hours.</p>
  //     <p>In the meantime, you can:</p>
  //     <ul>
  //       <li>Check our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/help">Help Center</a></li>
  //       <li>Join our <a href="https://discord.gg/voisss">Discord community</a></li>
  //       <li>Follow us on <a href="https://twitter.com/voisss_app">Twitter</a></li>
  //     </ul>
  //     <p>Best regards,<br>The VOISSS Team</p>
  //   `
  // });
}