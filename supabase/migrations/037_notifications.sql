CREATE TABLE public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN (
               'campaign_member_joined', 'session_scheduled',
               'session_updated', 'ai_complete', 'system_alert')),
  title      text        NOT NULL,
  message    text        NOT NULL,
  read       boolean     NOT NULL DEFAULT false,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for this table (required for postgres_changes subscriptions)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE POLICY "own_read"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Trigger: player joins campaign → notify DM
CREATE OR REPLACE FUNCTION notify_campaign_member_joined()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_campaign_name text;
  v_dm_id         uuid;
  v_joiner_name   text;
BEGIN
  SELECT c.name, c.user_id
    INTO v_campaign_name, v_dm_id
    FROM public.campaigns c
   WHERE c.id = NEW.campaign_id;

  SELECT COALESCE(p.display_name, p.email)
    INTO v_joiner_name
    FROM public.profiles p
   WHERE p.id = NEW.user_id;

  -- Don't notify if DM joins their own campaign
  IF v_dm_id IS NOT NULL AND v_dm_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_dm_id,
      'campaign_member_joined',
      'Nieuwe speler deelgenomen',
      COALESCE(v_joiner_name, 'Een speler') || ' is deelgenomen aan ' || v_campaign_name,
      jsonb_build_object('campaign_id', NEW.campaign_id, 'user_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_campaign_member_joined
  AFTER INSERT ON public.campaign_members
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_member_joined();

-- Trigger: session published (committed flips to true) → notify campaign members
CREATE OR REPLACE FUNCTION notify_session_scheduled()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member record;
BEGIN
  -- Only fire when committed transitions from false/null → true
  IF NEW.committed = true AND (TG_OP = 'INSERT' OR OLD.committed IS DISTINCT FROM true) THEN
    FOR v_member IN
      SELECT cm.user_id
        FROM public.campaign_members cm
       WHERE cm.campaign_id = NEW.campaign_id
         AND cm.user_id != NEW.user_id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_member.user_id,
        'session_scheduled',
        'Nieuwe sessie gepland',
        NEW.name || ' is ingepland',
        jsonb_build_object('session_id', NEW.id, 'campaign_id', NEW.campaign_id)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_published
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION notify_session_scheduled();

-- Trigger: session status changed (on committed sessions) → notify campaign members
CREATE OR REPLACE FUNCTION notify_session_status_changed()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member record;
  v_label  text;
BEGIN
  IF OLD.committed = true
     AND NEW.committed = true
     AND OLD.status IS DISTINCT FROM NEW.status
  THEN
    v_label := CASE NEW.status
      WHEN 'active'    THEN 'Actief'
      WHEN 'completed' THEN 'Voltooid'
      WHEN 'archived'  THEN 'Gearchiveerd'
      ELSE NEW.status
    END;

    FOR v_member IN
      SELECT cm.user_id
        FROM public.campaign_members cm
       WHERE cm.campaign_id = NEW.campaign_id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_member.user_id,
        'session_updated',
        'Sessie bijgewerkt',
        NEW.name || ' is nu: ' || v_label,
        jsonb_build_object('session_id', NEW.id, 'campaign_id', NEW.campaign_id)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_status_changed
  AFTER UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION notify_session_status_changed();
