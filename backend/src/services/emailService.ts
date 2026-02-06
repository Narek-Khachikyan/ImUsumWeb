import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  if (!env.SMTP_HOST) {
    throw new Error('SMTP is not configured: SMTP_HOST is required');
  }

  const useTls = env.SMTP_USE_TLS;
  const useImplicitTls = useTls && env.SMTP_PORT === 465;

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: useImplicitTls,
    requireTLS: useTls && !useImplicitTls,
    auth: env.SMTP_USERNAME ? { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD } : undefined,
  });

  await transport.sendMail({
    from: env.SMTP_FROM_EMAIL,
    to: toEmail,
    subject: 'ImUsum Password Reset',
    text: [
      'You requested a password reset.',
      '',
      `Use the following link to reset your password: ${resetLink}`,
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
  });
}
