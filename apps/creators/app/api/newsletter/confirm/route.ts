import { NextResponse } from 'next/server';
import { createBrowserClient as createClient } from '@smartnews/database';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('id, status, email, author_id')
      .eq('verification_token', token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    if (subscriber.status === 'active') {
      return NextResponse.json(
        { message: 'Already verified' },
        { status: 200 }
      );
    }

    // Update subscriber status to active
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'active',
        verified_at: new Date().toISOString(),
        verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error updating subscriber:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Subscription verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
