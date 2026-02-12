CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  target_id uuid REFERENCES users(id),
  action text NOT NULL,
  previous_value text,
  new_value text,
  created_at timestamptz DEFAULT now()
);
