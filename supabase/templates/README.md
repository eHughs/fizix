# Trader Analytics email templates

These templates share the same muted amber / warm charcoal visual identity as the Trader Analytics web app and are designed with table layouts and inline styles for broad email-client compatibility.

## Authentication templates

| Supabase template | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirmation.html` | `Confirm your Trader Analytics account` |
| Reset password | `recovery.html` | `Reset your Trader Analytics password` |
| Magic link | `magic_link.html` | `Your secure Trader Analytics sign-in link` |
| Invite user | `invite.html` | `You’re invited to Trader Analytics` |
| Change email address | `email_change.html` | `Confirm your new Trader Analytics email` |
| Reauthentication | `reauthentication.html` | `{{ .Token }} is your Trader Analytics verification code` |

## Security notification templates

| Supabase notification | File |
| --- | --- |
| Password changed | `password_changed_notification.html` |
| Email address changed | `email_changed_notification.html` |
| Phone number changed | `phone_changed_notification.html` |
| Verification method added | `mfa_factor_enrolled_notification.html` |
| Verification method removed | `mfa_factor_unenrolled_notification.html` |
| Sign-in method linked | `identity_linked_notification.html` |
| Sign-in method removed | `identity_unlinked_notification.html` |

## Hosted Supabase

Hosted Supabase does not automatically read these repository files. The project includes `scripts/apply-supabase-email-templates.mjs`, which updates all hosted Auth templates through the official Supabase Management API.

Run it only from a trusted local environment:

```bash
SUPABASE_ACCESS_TOKEN="..." \
SUPABASE_PROJECT_REF="..." \
npm run email:apply
```

`SUPABASE_ACCESS_TOKEN` is a sensitive Supabase Management personal access token. Never commit it to GitHub, expose it in browser code, or add it to a `NEXT_PUBLIC_*` environment variable.

Alternatively, copy the corresponding template HTML and subjects into **Supabase Dashboard → Authentication → Email Templates**. Security-notification emails must also be enabled in the hosted project before Supabase will send them.

For production deliverability and a professional sender identity, configure custom SMTP in Supabase and use a verified sender such as `Trader Analytics <no-reply@your-domain>` rather than relying on the default shared mail service.
