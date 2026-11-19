-- Owner notifications go to Gmail; the sender is configured separately via RESEND_FROM_EMAIL.
-- Update both revision fields so stale admin drafts cannot overwrite this change.
update public.site_content
set content = jsonb_set(
      jsonb_set(content, '{booking,ownerEmail}', '"gerkapoolhouse@gmail.com"'::jsonb),
      '{updatedAt}', to_jsonb(statement_timestamp())
    ),
    updated_at = statement_timestamp()
where id = 'main'
  and content #>> '{booking,ownerEmail}' is distinct from 'gerkapoolhouse@gmail.com';
