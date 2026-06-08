export { EmailService, createEmailService } from "./factory";
export { SmtpProvider } from "./smtp";
export { SendGridProvider } from "./sendgrid";
export { MailersendProvider } from "./mailersend";
export { passwordResetEmail } from "./templates";
export type { EmailProvider, EmailMessage, EmailConfig } from "./types";