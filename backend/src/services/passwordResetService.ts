import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { generateResetToken, getPasswordHash, hashResetToken } from '../lib/security.js';
import { sendPasswordResetEmail } from './emailService.js';

export async function requestPasswordReset(params: {
  userId: number;
  email: string;
  requestedIp?: string;
  requestedUserAgent?: string;
}): Promise<void> {
  const now = new Date();

  await prisma.passwordResetToken.updateMany({
    where: {
      user_id: params.userId,
      used_at: null,
      expires_at: { gt: now },
    },
    data: {
      used_at: now,
    },
  });

  const rawToken = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      user_id: params.userId,
      token_hash: hashResetToken(rawToken),
      expires_at: new Date(now.getTime() + env.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES * 60 * 1000),
      requested_ip: params.requestedIp ?? null,
      requested_user_agent: params.requestedUserAgent ? params.requestedUserAgent.slice(0, 500) : null,
      created_at: now,
    },
  });

  const resetLink = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail(params.email, resetLink);
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const now = new Date();
  const tokenHash = hashResetToken(token);

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token_hash: tokenHash },
  });

  if (!tokenRecord || tokenRecord.used_at || tokenRecord.expires_at <= now) {
    return false;
  }

  const user = await prisma.user.findUnique({ where: { id: tokenRecord.user_id } });
  if (!user || !user.is_active) {
    return false;
  }

  const hashedPassword = await getPasswordHash(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        hashed_password: hashedPassword,
        token_version: { increment: 1 },
      },
    });

    await tx.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used_at: now },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        user_id: user.id,
        id: { not: tokenRecord.id },
        used_at: null,
      },
      data: { used_at: now },
    });
  });

  return true;
}
