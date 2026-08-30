import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(root, "supabase", "templates");
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const explicitProjectRef = process.env.SUPABASE_PROJECT_REF;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const inferredProjectRef = projectUrl ? new URL(projectUrl).hostname.split(".")[0] : undefined;
const projectRef = explicitProjectRef || inferredProjectRef;

if (!accessToken) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required. Use a Supabase Management API personal access token and never commit it.");
}
if (!projectRef) {
  throw new Error("Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL so the target project can be identified.");
}

async function template(name) {
  return readFile(path.join(templatesDir, name), "utf8");
}

const payload = {
  mailer_subjects_confirmation: "Confirm your Trader Analytics account",
  mailer_templates_confirmation_content: await template("confirmation.html"),
  mailer_subjects_recovery: "Reset your Trader Analytics password",
  mailer_templates_recovery_content: await template("recovery.html"),
  mailer_subjects_magic_link: "Your secure Trader Analytics sign-in link",
  mailer_templates_magic_link_content: await template("magic_link.html"),
  mailer_subjects_invite: "You’re invited to Trader Analytics",
  mailer_templates_invite_content: await template("invite.html"),
  mailer_subjects_email_change: "Confirm your new Trader Analytics email",
  mailer_templates_email_change_content: await template("email_change.html"),
  mailer_subjects_reauthentication: "{{ .Token }} is your Trader Analytics verification code",
  mailer_templates_reauthentication_content: await template("reauthentication.html"),

  mailer_notifications_password_changed_enabled: true,
  mailer_subjects_password_changed_notification: "Your Trader Analytics password was changed",
  mailer_templates_password_changed_notification_content: await template("password_changed_notification.html"),
  mailer_notifications_email_changed_enabled: true,
  mailer_subjects_email_changed_notification: "Your Trader Analytics email address was changed",
  mailer_templates_email_changed_notification_content: await template("email_changed_notification.html"),
  mailer_notifications_phone_changed_enabled: true,
  mailer_subjects_phone_changed_notification: "Your Trader Analytics phone number was changed",
  mailer_templates_phone_changed_notification_content: await template("phone_changed_notification.html"),
  mailer_notifications_mfa_factor_enrolled_enabled: true,
  mailer_subjects_mfa_factor_enrolled_notification: "A new verification method was added to Trader Analytics",
  mailer_templates_mfa_factor_enrolled_notification_content: await template("mfa_factor_enrolled_notification.html"),
  mailer_notifications_mfa_factor_unenrolled_enabled: true,
  mailer_subjects_mfa_factor_unenrolled_notification: "A verification method was removed from Trader Analytics",
  mailer_templates_mfa_factor_unenrolled_notification_content: await template("mfa_factor_unenrolled_notification.html"),
  mailer_notifications_identity_linked_enabled: true,
  mailer_subjects_identity_linked_notification: "A new sign-in method was linked to Trader Analytics",
  mailer_templates_identity_linked_notification_content: await template("identity_linked_notification.html"),
  mailer_notifications_identity_unlinked_enabled: true,
  mailer_subjects_identity_unlinked_notification: "A sign-in method was removed from Trader Analytics",
  mailer_templates_identity_unlinked_notification_content: await template("identity_unlinked_notification.html"),
};

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Supabase rejected the template update (${response.status}): ${body}`);
}

console.log(`Applied ${Object.keys(payload).length} Trader Analytics auth email settings to ${projectRef}.`);
