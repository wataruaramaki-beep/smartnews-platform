// Export all database types
export * from './types/database';
export * from './types/database-generated';

// Export Supabase clients (excluding server-only functions)
export { createClient as createBrowserClient } from './supabase/client';
