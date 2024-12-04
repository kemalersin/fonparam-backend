import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Whitelist'leri env'den al ve diziye çevir
const whitelistIPs = process.env.RATE_LIMIT_WHITELIST_IPS?.split(',').map(ip => ip.trim()) || [];
const whitelistDomains = process.env.RATE_LIMIT_WHITELIST_DOMAINS?.split(',').map(domain => domain.trim()) || [];

// Rate limit ayarları
export const RATE_LIMITS = {
    FUNDS_LIST: { MAX: 25, WINDOW_MINUTES: 15, DAILY_MAX: 100 },
    FUND_DETAIL: { MAX: 25, WINDOW_MINUTES: 15, DAILY_MAX: 100 },
    FUND_HISTORY: { MAX: 25, WINDOW_MINUTES: 15, DAILY_MAX: 100 },
    FUND_COMPARE: { MAX: 25, WINDOW_MINUTES: 15, DAILY_MAX: 100 },
    COMPANIES_LIST: { MAX: 25, WINDOW_MINUTES: 15, DAILY_MAX: 100 },
    COMPANY_DETAIL: { MAX: 25, WINDOW_MINUTES: 15, DAILY_MAX: 100 }
} as const;

// Rate limit kontrolü için store
const dailyStore = new Map<string, { count: number, resetTime: number }>();

export const rateLimiter = (type: string, max: number, windowMinutes: number) => {
    // 15 dakikalık limit
    const shortTermLimiter = rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        message: {
            error: 'Çok fazla istek yapıldı. Lütfen daha sonra tekrar deneyin.'
        },
        keyGenerator: (req) => `${type}-${req.ip}`,
        skip: (req) => isWhitelisted(req)
    });

    // Günlük limit
    const dailyLimiter = (req: any, res: any, next: any) => {
        if (isWhitelisted(req)) {
            return next();
        }

        const key = `${type}-${req.ip}-daily`;
        const now = Date.now();
        const dayStart = new Date().setHours(0, 0, 0, 0);
        const record = dailyStore.get(key);

        if (!record || record.resetTime < now) {
            // Yeni gün başlangıcı
            dailyStore.set(key, {
                count: 1,
                resetTime: dayStart + 24 * 60 * 60 * 1000 // Bir sonraki gün
            });
            return next();
        }

        if (record.count >= RATE_LIMITS[type as keyof typeof RATE_LIMITS].DAILY_MAX) {
            return res.status(429).json({
                error: 'Günlük istek limitine ulaşıldı. Yarın tekrar deneyin.'
            });
        }

        record.count++;
        dailyStore.set(key, record);
        next();
    };

    return [dailyLimiter, shortTermLimiter];
};

// Whitelist kontrolü
const isWhitelisted = (req: any) => {
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
}; 