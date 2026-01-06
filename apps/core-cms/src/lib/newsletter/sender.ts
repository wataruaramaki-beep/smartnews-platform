import { resend, validateResendConfig, DEFAULT_FROM_EMAIL } from '@/lib/email/resend';
import { render } from '@react-email/render';
import { NewsletterEmail } from '@/lib/email/templates/NewsletterEmail';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import * as React from 'react';

export interface SendResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * バッチでニュースレターを送信
 */
export async function sendNewsletterBatch(
  author: any,
  posts: any[],
  subscribers: any[],
  deliveryId: string
): Promise<SendResult> {
  validateResendConfig();

  const result: SendResult = {
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const subject = author.newsletter_title || `${author.display_name || author.username}の最新記事`;

  // Resend の制限: 1リクエストあたり50件まで
  const BATCH_SIZE = 50;
  const batches = chunkArray(subscribers, BATCH_SIZE);

  for (const batch of batches) {
    for (const subscriber of batch) {
      try {
        const unsubscribeUrl = `${baseUrl}/${author.username}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

        const emailHtml = await render(
          React.createElement(NewsletterEmail, {
            authorName: author.display_name || author.username,
            authorUsername: author.username,
            newsletterTitle: author.newsletter_title || subject,
            posts: posts.map((p: any) => ({
              title: p.title,
              slug: p.slug,
              thumbnail_url: p.thumbnail_url,
              genre: p.genre,
              published_at: p.published_at,
            })),
            unsubscribeUrl,
            baseUrl,
          })
        );

        const fromEmail = author.newsletter_from_email || DEFAULT_FROM_EMAIL;
        const fromName = author.newsletter_from_name || author.display_name || author.username;

        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: subscriber.email,
          subject,
          html: emailHtml,
        });

        result.successCount++;
      } catch (error: any) {
        result.failureCount++;
        result.errors.push({
          email: subscriber.email,
          error: error.message,
        });
        console.error(`Failed to send to ${subscriber.email}:`, error);
      }
    }

    // レート制限対策: バッチ間に500ms待機
    if (batches.indexOf(batch) < batches.length - 1) {
      await sleep(500);
    }
  }

  return result;
}

/**
 * 配信レコード作成
 */
export async function createDeliveryRecord(data: {
  authorId: string;
  postIds: string[];
  subscriberCount: number;
  subject: string;
}): Promise<string> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: delivery, error } = await supabase
    .from('newsletter_deliveries')
    .insert({
      author_id: data.authorId,
      subject: data.subject,
      post_ids: data.postIds,
      subscriber_count: data.subscriberCount,
      status: 'sending',
    })
    .select()
    .single();

  if (error) throw error;
  return delivery.id;
}

/**
 * 配信レコード更新
 */
export async function updateDeliveryRecord(
  deliveryId: string,
  updates: Partial<any>
): Promise<void> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { error } = await supabase
    .from('newsletter_deliveries')
    .update(updates)
    .eq('id', deliveryId);

  if (error) throw error;
}

/**
 * 投稿を送信済みとしてマーク
 */
export async function markPostsAsSent(postIds: string[]): Promise<void> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('posts')
    .update({ newsletter_sent_at: now })
    .in('id', postIds);

  if (error) throw error;
}

/**
 * author の最終送信日時を更新
 */
export async function updateLastSentAt(authorId: string): Promise<void> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({ newsletter_last_sent_at: now })
    .eq('id', authorId);

  if (error) throw error;
}

// ヘルパー関数
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
