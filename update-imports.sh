#!/bin/bash

# Update imports in core-cms to use @smartnews/database

cd /Users/wataru.aramaki/SmartNews/smartnews-platform/apps/core-cms

# Replace client imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '@/lib/supabase/client'|from '@smartnews/database'|g" {} \;

# Replace server imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '@/lib/supabase/server'|from '@smartnews/database'|g" {} \;

# Replace middleware imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '@/lib/supabase/middleware'|from '@smartnews/database'|g" {} \;

# Replace public-client imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '@/lib/supabase/public-client'|from '@smartnews/database'|g" {} \;

# Update createClient to specific names
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|import { createClient } from '@smartnews/database'|import { createBrowserClient as createClient } from '@smartnews/database'|g" {} \;

# Fix server-side createClient (need manual check after)
find src -type f -name "*.tsx" -path "*/app/*" -exec grep -l "createClient" {} \; | while read file; do
  if grep -q "'@smartnews/database'" "$file"; then
    echo "Check $file for correct client type"
  fi
done

echo "Import update complete! Please verify the changes."
