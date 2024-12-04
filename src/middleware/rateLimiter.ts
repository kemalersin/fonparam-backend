import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Whitelist'leri env'den al ve diziye çevir
const whitelistIPs = process.env.RATE_LIMIT_WHITELIST_IPS?.split(',').map(ip => ip.trim()) || [];
const whitelistDomains = process.env.RATE_LIMIT_WHITELIST_DOMAINS?.split(',').map(domain => domain.trim()) || [];

export const RATE_LIMITS = {
    FUNDS_LIST: { MAX: 100, WINDOW_MINUTES: 1 },
    FUND_DETAIL: { MAX: 100, WINDOW_MINUTES: 1 },
    FUND_HISTORY: { MAX: 50, WINDOW_MINUTES: 1 },
    FUND_COMPARE: { MAX: 30, WINDOW_MINUTES: 1 },
    COMPANIES_LIST: { MAX: 100, WINDOW_MINUTES: 1 },
    COMPANY_DETAIL: { MAX: 100, WINDOW_MINUTES: 1 }
} as const;

export const rateLimiter = (type: string, max: number, windowMinutes: number) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        message: {
            error: 'Çok fazla istek yapıldı. Lütfen daha sonra tekrar deneyin.'
        },
        keyGenerator: (req) => `${type}-${req.ip}`,
        skip: (req) => {
            // IP kontrolü
            const ip = req.ip;
            if (ip && whitelistIPs.includes(ip)) {
                return true;
            }

            // Origin/Referer kontrolü
            const origin = req.get('origin') || req.get('referer');
            if (origin) {
                try {
                    const hostname = new URL(origin).hostname;
                    if (whitelistDomains.includes(hostname)) {
                        return true;
                    }
                } catch (e) {
                    console.error('Origin/Referer parse hatası:', e);
                }
            }

            return false;
        }
    });
}; 