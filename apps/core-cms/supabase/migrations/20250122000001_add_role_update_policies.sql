-- Create helper function to check if user can edit another user's role
CREATE OR REPLACE FUNCTION public.can_edit_user_role(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles target
    WHERE target.id = target_user_id
    AND target.deleted_at IS NULL
    AND (
      -- User is admin (can edit anyone)
      public.get_my_role() = 'admin'
      OR
      -- User is parent of target user
      target.parent_id = auth.uid()
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Add policy to allow role updates for admins and parent accounts
CREATE POLICY "Admins and parents can update user roles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR  -- Can always update own profile
    public.can_edit_user_role(id)  -- Or has permission to edit this user
  )
  WITH CHECK (
    -- If role is being changed, must have permission
    (role = (SELECT role FROM profiles WHERE id = auth.uid()) OR public.can_edit_user_role(id))
  );
