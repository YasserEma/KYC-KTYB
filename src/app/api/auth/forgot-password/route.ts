import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/route-handler';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    const { supabase } = createClient(request);

    // Get the origin from the request to construct the redirect URL
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const locale = request.headers.get('x-locale') || 'en';
    
    // Construct the reset password redirect URL
    const redirectTo = `${origin}/${locale}/auth/reset-password`;

    // Send password reset email - Supabase will handle email existence check internally
    // It will only send emails to registered users
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('Password reset error:', error);
      
      // Log the failed attempt for audit purposes
      try {
        await supabase.from('audit_logs').insert({
          action: 'AUTH_PASSWORD_RESET_FAILED',
          actor_user_id: null,
          actor_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          tenant_id: request.headers.get('x-tenant-id') || null,
          metadata: { 
            email, 
            error: error.message,
            redirect_to: redirectTo
          }
        });
      } catch (auditError) {
        console.error('Failed to log password reset error:', auditError);
      }

      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    // Log successful password reset request
    try {
      await supabase.from('audit_logs').insert({
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        actor_user_id: null,
        actor_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        tenant_id: request.headers.get('x-tenant-id') || null,
        metadata: { 
          email,
          redirect_to: redirectTo
        }
      });
    } catch (auditError) {
      console.error('Failed to log password reset request:', auditError);
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully',
      success: true
    });

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}