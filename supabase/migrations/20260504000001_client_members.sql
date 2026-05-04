-- Team members per client (comercial, financeiro)
CREATE TABLE client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT NOT NULL,
  member_email TEXT NOT NULL,
  member_name TEXT,
  role TEXT NOT NULL DEFAULT 'comercial',
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_user_id, client_id, member_email)
);

ALTER TABLE client_members ENABLE ROW LEVEL SECURITY;

-- Agency owner manages their members
CREATE POLICY "agency_manage_members" ON client_members
  FOR ALL USING (auth.uid() = agency_user_id);

-- Team member can read their own record (for invite acceptance)
CREATE POLICY "member_read_own" ON client_members
  FOR SELECT USING (auth.uid() = member_user_id);

-- Allow reading by invite token (via service role only — InvitePage uses edge fn)

-- Team members can view contacts of their assigned client
CREATE POLICY "team_member_view_contacts" ON contacts
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_members
      WHERE member_user_id = auth.uid() AND accepted = true
    )
  );

-- Team members can view webhook leads of their assigned client
CREATE POLICY "team_member_view_webhook_leads" ON webhook_leads
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_members
      WHERE member_user_id = auth.uid() AND accepted = true
    )
  );

-- Team members can view webhook endpoints (to know the source name)
CREATE POLICY "team_member_view_webhook_endpoints" ON webhook_endpoints
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_members
      WHERE member_user_id = auth.uid() AND accepted = true
    )
  );
