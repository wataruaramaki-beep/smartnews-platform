import { NextResponse } from 'next/server';
import { createBrowserClient as createClient } from '@smartnews/database';

export async function POST(request: Request) {
  try {
    const { email, authorUsername } = await request.json();

    if (!email || !authorUsername) {
      return NextResponse.json(
        { error: 'Email and authorUsername are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get author by username
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', authorUsername)
      .is('deleted_at', null)
      .single();

    if (authorError || !author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    // Find subscriber
    const { data: subscriber, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('author_id', author.id)
      .eq('email', email)
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json(
        { message: 'Already unsubscribed' },
        { status: 200 }
      );
    }

    // Update status to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully unsubscribed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
