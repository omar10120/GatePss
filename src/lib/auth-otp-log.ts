import { logger } from '@/lib/logger';

const LOG_PREFIX = '[Auth/OTP]';

function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain || !local) return '***';
    const visible = local.length <= 2 ? '*' : local.slice(0, 2);
    return `${visible}***@${domain}`;
}

/** Mask OTP in logs unless AUTH_OTP_LOG_CODE=true (local debugging only). */
export function formatOtpForLog(otpCode: string): string {
    if (process.env.AUTH_OTP_LOG_CODE === 'true') {
        return otpCode;
    }
    return `****${otpCode.slice(-1)}`;
}

export function getOtpPolicySnapshot(email: string) {
    const otpDisabled = process.env.AUTH_OTP_DISABLED === 'true';
    const bypassRaw = process.env.AUTH_OTP_BYPASS_EMAILS
        || 'amr.dawoodi@hotmail.com,amrooody7@gmail.com';
    const bypassList = bypassRaw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    const normalizedEmail = email.trim().toLowerCase();
    const inBypassList = bypassList.includes(normalizedEmail);

    return {
        authOtpDisabled: otpDisabled,
        authOtpBypassEmailsCount: bypassList.length,
        emailInBypassList: inBypassList,
        otpRequired: !otpDisabled && !inBypassList,
        bypassReason: otpDisabled
            ? 'AUTH_OTP_DISABLED=true'
            : inBypassList
              ? 'email in AUTH_OTP_BYPASS_EMAILS'
              : 'none — OTP flow will run',
    };
}

export function getSmtpConfigSnapshot() {
    const smtpUser = process.env.SMTP_USER || '';
    const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || '';
    return {
        smtpHost: process.env.SMTP_HOST || '(not set)',
        smtpPort: process.env.SMTP_PORT || '587',
        smtpUser: smtpUser ? maskEmail(smtpUser) : '(not set)',
        emailFrom: emailFrom ? maskEmail(emailFrom) : '(not set)',
        fromMatchesUser: Boolean(smtpUser && emailFrom && smtpUser === emailFrom),
        smtpPasswordSet: Boolean(process.env.SMTP_PASSWORD),
    };
}

/** Normalize nodemailer / SMTP errors into a log-friendly object. */
export function parseSmtpError(error: unknown): Record<string, unknown> {
    if (!error || typeof error !== 'object') {
        return { message: String(error) };
    }

    const err = error as Record<string, unknown>;
    const parsed: Record<string, unknown> = {
        message: err.message,
        name: err.name,
        code: err.code,
        command: err.command,
        responseCode: err.responseCode,
        response: err.response,
    };

    if (Array.isArray(err.rejected)) {
        parsed.rejected = err.rejected;
    }
    if (Array.isArray(err.rejectedErrors) && err.rejectedErrors.length > 0) {
        parsed.rejectedErrors = err.rejectedErrors.map((e) =>
            e && typeof e === 'object' && 'message' in e
                ? (e as { message?: string; response?: string }).message
                : String(e)
        );
    }

    if (typeof err.stack === 'string' && process.env.NODE_ENV === 'development') {
        parsed.stack = err.stack.split('\n').slice(0, 5).join('\n');
    }

    return parsed;
}

export const authOtpLog = {
    loginStarted(email: string) {
        logger.info(`${LOG_PREFIX} Login attempt`, {
            event: 'login_started',
            email: maskEmail(email),
        });
    },

    passwordOk(userId: number, email: string, role: string) {
        logger.info(`${LOG_PREFIX} Password verified`, {
            event: 'password_ok',
            userId,
            email: maskEmail(email),
            role,
        });
    },

    otpPolicy(email: string) {
        const policy = getOtpPolicySnapshot(email);
        logger.info(`${LOG_PREFIX} OTP policy check`, {
            event: 'otp_policy',
            email: maskEmail(email),
            ...policy,
            smtp: getSmtpConfigSnapshot(),
        });
        return policy;
    },

    otpBypassed(email: string, reason: string) {
        logger.info(`${LOG_PREFIX} OTP bypassed — direct login`, {
            event: 'otp_bypassed',
            email: maskEmail(email),
            reason,
        });
    },

    otpGenerated(userId: number, email: string, otpCode: string, expiresAt: Date) {
        logger.info(`${LOG_PREFIX} OTP generated`, {
            event: 'otp_generated',
            userId,
            email: maskEmail(email),
            otp: formatOtpForLog(otpCode),
            expiresAt: expiresAt.toISOString(),
            hint:
                process.env.AUTH_OTP_LOG_CODE !== 'true'
                    ? 'Set AUTH_OTP_LOG_CODE=true in .env to log full OTP locally'
                    : undefined,
        });
    },

    otpEmailSending(email: string) {
        logger.info(`${LOG_PREFIX} Sending OTP email`, {
            event: 'otp_email_sending',
            to: maskEmail(email),
            smtp: getSmtpConfigSnapshot(),
        });
    },

    otpEmailSent(email: string, messageId?: string) {
        logger.info(`${LOG_PREFIX} OTP email sent`, {
            event: 'otp_email_sent',
            to: maskEmail(email),
            messageId: messageId || '(unknown)',
        });
    },

    otpEmailFailed(email: string, error: unknown) {
        const smtpError = parseSmtpError(error);
        const smtp = getSmtpConfigSnapshot();

        logger.error(`${LOG_PREFIX} OTP email failed`, {
            event: 'otp_email_failed',
            to: maskEmail(email),
            smtp,
            smtpError,
            hints: [
                !smtp.smtpPasswordSet && 'SMTP_PASSWORD is missing',
                !smtp.fromMatchesUser &&
                    'EMAIL_FROM must match SMTP_USER (same mailbox on your mail server)',
                smtpError.responseCode === 553 &&
                    '553 = sender rejected — fix FROM address or mailbox ownership',
                smtpError.code === 'EAUTH' && 'EAUTH = wrong SMTP username/password',
            ].filter(Boolean),
        });
    },

    loginFailed(email: string, stage: string, error: unknown) {
        logger.error(`${LOG_PREFIX} Login failed`, {
            event: 'login_failed',
            stage,
            email: maskEmail(email),
            error: parseSmtpError(error),
        });
    },

    otpFlowComplete(email: string) {
        logger.info(`${LOG_PREFIX} OTP flow complete — awaiting verification`, {
            event: 'otp_flow_complete',
            email: maskEmail(email),
        });
    },

    smtpConnectionOk() {
        logger.info(`${LOG_PREFIX} SMTP connection verified`, {
            event: 'smtp_connection_ok',
            smtp: getSmtpConfigSnapshot(),
        });
    },

    smtpConnectionFailed(error: unknown) {
        logger.error(`${LOG_PREFIX} SMTP connection failed`, {
            event: 'smtp_connection_failed',
            smtp: getSmtpConfigSnapshot(),
            smtpError: parseSmtpError(error),
        });
    },
};
