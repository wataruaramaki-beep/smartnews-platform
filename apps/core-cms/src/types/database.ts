export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'creator' | 'reader';
export type PostStatus = 'draft' | 'published' | 'scheduled';
export type NewsletterFrequency = 'daily' | 'weekly' | 'monthly';
export type NewsletterSendMode = 'immediate' | 'digest';
export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed' | 'bounced';
export type DeliveryStatus = 'sending' | 'completed' | 'failed';

// TipTap/ProseMirror content type
export type TipTapContent = {
  type: string;
  content?: TipTapContent[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  [key: string]: any;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          parent_id: string | null;
          stripe_customer_id: string | null;
          is_subscribed: boolean;
          feed_enabled: boolean;
          feed_title: string | null;
          feed_description: string | null;
          newsletter_enabled: boolean;
          newsletter_send_mode: NewsletterSendMode;
          newsletter_frequency: NewsletterFrequency;
          newsletter_title: string | null;
          newsletter_description: string | null;
          newsletter_from_name: string | null;
          newsletter_from_email: string | null;
          newsletter_last_sent_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          parent_id?: string | null;
          stripe_customer_id?: string | null;
          is_subscribed?: boolean;
          feed_enabled?: boolean;
          feed_title?: string | null;
          feed_description?: string | null;
          newsletter_enabled?: boolean;
          newsletter_send_mode?: NewsletterSendMode;
          newsletter_frequency?: NewsletterFrequency;
          newsletter_title?: string | null;
          newsletter_description?: string | null;
          newsletter_from_name?: string | null;
          newsletter_from_email?: string | null;
          newsletter_last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          parent_id?: string | null;
          stripe_customer_id?: string | null;
          is_subscribed?: boolean;
          feed_enabled?: boolean;
          feed_title?: string | null;
          feed_description?: string | null;
          newsletter_enabled?: boolean;
          newsletter_send_mode?: NewsletterSendMode;
          newsletter_frequency?: NewsletterFrequency;
          newsletter_title?: string | null;
          newsletter_description?: string | null;
          newsletter_from_name?: string | null;
          newsletter_from_email?: string | null;
          newsletter_last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          content: TipTapContent | null;
          thumbnail_url: string | null;
          genre: string | null;
          tags: string[];
          status: PostStatus;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_image_url: string | null;
          newsletter_sent_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          content?: TipTapContent | null;
          thumbnail_url?: string | null;
          genre?: string | null;
          tags?: string[];
          status?: PostStatus;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image_url?: string | null;
          newsletter_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          content?: TipTapContent | null;
          thumbnail_url?: string | null;
          genre?: string | null;
          tags?: string[];
          status?: PostStatus;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image_url?: string | null;
          newsletter_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          author_id: string;
          email: string;
          status: SubscriberStatus;
          verification_token: string | null;
          verified_at: string | null;
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          email: string;
          status?: SubscriberStatus;
          verification_token?: string | null;
          verified_at?: string | null;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          email?: string;
          status?: SubscriberStatus;
          verification_token?: string | null;
          verified_at?: string | null;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      newsletter_deliveries: {
        Row: {
          id: string;
          author_id: string;
          subject: string;
          post_ids: string[];
          subscriber_count: number;
          sent_count: number;
          failed_count: number;
          status: DeliveryStatus;
          error_message: string | null;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          subject: string;
          post_ids: string[];
          subscriber_count?: number;
          sent_count?: number;
          failed_count?: number;
          status?: DeliveryStatus;
          error_message?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          subject?: string;
          post_ids?: string[];
          subscriber_count?: number;
          sent_count?: number;
          failed_count?: number;
          status?: DeliveryStatus;
          error_message?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "newsletter_deliveries_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
