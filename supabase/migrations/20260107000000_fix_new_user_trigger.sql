-- Fix handle_new_user trigger to include username generation

-- Drop and recreate the function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, role)
    VALUES (
        NEW.id,
        NEW.email,
        LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_')),
        'reader'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
