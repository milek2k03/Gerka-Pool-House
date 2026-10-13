# Email Integrations

The frontend creates and stores a reservation inquiry number such as `GPH-20260531-AB12C`.

Automatic email delivery is optional and selected at runtime:

1. `VITE_RESERVATION_EMAIL_ENDPOINT`
   - Preferred for production.
   - The project includes a Vercel serverless endpoint at `/api/reservation-email`.
   - It sends two messages through Resend: owner notification and client auto-confirmation.
   - Keep `RESEND_API_KEY` on the server only. Never prefix it with `VITE_`.

Server variables:

```text
VITE_RESERVATION_EMAIL_ENDPOINT=/api/reservation-email
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Gerka Pool House <rezerwacje@gerkapoolhouse.pl>
RESERVATION_OWNER_EMAIL=rezerwacje@gerkapoolhouse.pl
ALLOWED_ORIGIN=https://gerkapoolhouse.pl
```

Replace `re_xxxxxxxxx` with the real API key from Resend. Keep it only in local
environment variables or hosting provider secrets. Do not commit a real key.

For the first test, Resend's quick-start sender can be used:

```text
RESEND_FROM_EMAIL=onboarding@resend.dev
RESERVATION_OWNER_EMAIL=your-email@example.com
```

For production, verify your domain in Resend and switch `RESEND_FROM_EMAIL` to an
address on that domain, for example:

```text
RESEND_FROM_EMAIL=Gerka Pool House <rezerwacje@gerkapoolhouse.pl>
```

If the endpoint is not configured, the inquiry is saved locally and an email payload is emitted as
`window` event `gerka:email:queued` for future backend integration.

Template variables:

```text
reservation_number
property_name
owner_email
client_name
email
client_email
phone
guests
check_in
check_out
nights
rooms_used
nightly_price
estimated_total
message
owner_subject
owner_body
client_subject
client_body
```


When Supabase is configured on the server (`SUPABASE_URL` / `SUPABASE_ANON_KEY`
or their `VITE_` equivalents), the owner recipient is read from the trusted
`site_content` row on each request. Editing `booking.ownerEmail` in the admin
panel therefore takes effect without changing server environment variables.
If that read fails, the endpoint returns 503 and does not send to an outdated
recipient. `RESERVATION_OWNER_EMAIL` remains a fallback for installations without
Supabase. The verified sender (`RESEND_FROM_EMAIL`) stays a server setting.
