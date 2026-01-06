import { NextResponse } from 'next/server';
import { createBrowserClient as createClient } from '@smartnews/database';
import { render } from '@react-email/render';
import { resend, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME, validateResendConfig } from '@/lib/email/resend';
import { VerificationEmail } from '@/lib/email/templates/VerificationEmail';
import { randomBytes } from 'crypto';
import * as React from 'react';

export async function POST(request: Request) {
  try {
    const { email, authorUsername } = await request.json();

    if (!email || !authorUsername) {
      return NextResponse.json(
        { error: 'Email and authorUsername are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get author by username
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('id, username, display_name, newsletter_enabled')
      .eq('username', authorUsername)
      .is('deleted_at', null)
      .single();

    if (authorError || !author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    if (!author.newsletter_enabled) {
      return NextResponse.json(
        { error: 'Newsletter is not enabled for this author' },
        { status: 403 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('author_id', author.id)
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { message: 'Already subscribed' },
          { status: 200 }
        );
      } else if (existing.status === 'unsubscribed' || existing.status === 'pending') {
        // Re-subscribe or resend verification: create new verification token
        const verificationToken = randomBytes(32).toString('hex');

        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'pending',
            verification_token: verificationToken,
            verified_at: null,
            unsubscribed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating subscriber:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        // Send verification email
        try {
          validateResendConfig();
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const verificationUrl = `${baseUrl}/${authorUsername}/newsletter/confirm?token=${verificationToken}`;
          const authorName = author.display_name || author.username;

          const emailHtml = await render(
            React.createElement(VerificationEmail, {
              authorName,
              verificationUrl,
            })
          );

          const result = await resend.emails.send({
            from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
            to: email,
            subject: `${authorName} のニュースレター購読を確認してください`,
            html: emailHtml,
          });

          console.log('Resend API response:', result);

          return NextResponse.json(
            { message: 'Verification email sent' },
            { status: 200 }
          );
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          return NextResponse.json(
            { error: 'Failed to send verification email' },
            { status: 500 }
          );
        }
      }
    }

    // Create new subscription
    const verificationToken = randomBytes(32).toString('hex');

    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        author_id: author.id,
        email,
        status: 'pending',
        verification_token: verificationToken,
      });

    if (insertError) {
      console.error('Error creating subscriber:', insertError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      validateResendConfig();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/${authorUsername}/newsletter/confirm?token=${verificationToken}`;
      const authorName = author.display_name || author.username;

      const emailHtml = await render(
        React.createElement(VerificationEmail, {
          authorName,
          verificationUrl,
        })
      );

      const result = await resend.emails.send({
        from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
        to: email,
        subject: `${authorName} のニュースレター購読を確認してください`,
        html: emailHtml,
      });

      console.log('Resend API response:', result);

      return NextResponse.json(
        { message: 'Verification email sent' },
        { status: 200 }
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
