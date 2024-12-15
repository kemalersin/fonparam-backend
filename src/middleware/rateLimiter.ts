import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';
import { ApiKeyService } from '../services/apiKeyService';
import { Request, Response, NextFunction } from 'express';

// Whitelist değerlerini al
const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST_IPS?.split(',') || [];
const whitelistedDomains = process.env.RATE_LIMIT_WHITELIST_DOMAINS?.split(',') || [];

// IP'nin whitelist'te olup olmadığını kontrol et
const isIpWhitelisted = (ip: string): boolean => {
    return whitelistedIPs.includes(ip.trim());
};

// Domain'in whitelist'te olup olmadığını kontrol et
const isDomainWhitelisted = (req: Request): boolean => {
    const origin = req.get('origin');
    if (!origin) return false;
    
    try {
        const hostname = new URL(origin).hostname;
        return whitelistedDomains.some(domain => hostname.endsWith(domain.trim()));
    } catch {
        return false;
    }
};

// Gerçek IP adresini al
const getClientIp = (req: Request): string => {
    // X-Real-IP header'ı varsa onu kullan (Nginx proxy arkasında çalışırken)
    const realIp = req.headers['x-real-ip'];
    if (realIp && !Array.isArray(realIp)) {
        return realIp;
    }

    // X-Forwarded-For header'ı varsa ilk IP'yi al
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = Array.isArray(forwardedFor) 
            ? forwardedFor[0] 
            : forwardedFor.split(',')[0].trim();
        if (ips) return ips;
    }

    // req.ip'yi kontrol et
    const ip = req.ip?.replace(/^::ffff:/, ''); // IPv4 mapped IPv6 adreslerini düzelt
    if (ip && ip !== '::1') {
        return ip;
    }

    // Hiçbiri bulunamazsa varsayılan değer
    return 'unknown';
};

// API anahtarını request header'dan alan ve doğrulayan yardımcı fonksiyon
const validateApiKey = async (req: Request): Promise<{ key: string; dailyLimit: number; monthlyLimit: number }> => {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
        // API key yoksa IP bazlı limit uygula
        return { key: getClientIp(req), dailyLimit: 100, monthlyLimit: 3000 };
    }

    const validatedKey = await ApiKeyService.validateKey(apiKey);
    
    if (!validatedKey) {
        // Geçersiz API key
        throw new Error('Invalid API key');
    }

    return { 
        key: apiKey, 
        dailyLimit: validatedKey.daily_limit,
        monthlyLimit: validatedKey.monthly_limit
    };
};

// Günlük ve aylık istek sayılarını kontrol et
const checkRateLimits = async (key: string): Promise<{ dailyCount: number; monthlyCount: number }> => {
    const now = new Date();
    const dailyKey = `daily:${key}:${now.toISOString().split('T')[0]}`;
    const monthlyKey = `monthly:${key}:${now.toISOString().slice(0, 7)}`;

    const [dailyCount, monthlyCount] = await Promise.all([
        redisClient.get(dailyKey),
        redisClient.get(monthlyKey)
    ]);

    return {
        dailyCount: parseInt(dailyCount || '0'),
        monthlyCount: parseInt(monthlyCount || '0')
    };
};

// Rate limiter middleware'ini oluştur
const createRateLimiter = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Whitelist kontrolü
            const clientIp = getClientIp(req);
            if (isIpWhitelisted(clientIp) || isDomainWhitelisted(req)) {
                return next();
            }

            const { key, dailyLimit, monthlyLimit } = await validateApiKey(req);
            const { dailyCount, monthlyCount } = await checkRateLimits(key);

            // Limit kontrolü
            if (dailyCount >= dailyLimit) {
                return res.status(429).json({
                    error: 'Günlük API istek limitiniz doldu',
                    message: 'Lütfen yarın tekrar deneyin veya premium hesaba geçiş yapın',
                    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
            }

            if (monthlyCount >= monthlyLimit) {
                return res.status(429).json({
                    error: 'Aylık API istek limitiniz doldu',
                    message: 'Lütfen gelecek ay tekrar deneyin veya premium hesaba geçiş yapın',
                    resetTime: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
                });
            }

            // İstek sayaçlarını güncelle
            const now = new Date();
            const dailyKey = `daily:${key}:${now.toISOString().split('T')[0]}`;
            const monthlyKey = `monthly:${key}:${now.toISOString().slice(0, 7)}`;

            await Promise.all([
                redisClient.incr(dailyKey),
                redisClient.incr(monthlyKey),
                redisClient.expire(dailyKey, 24 * 60 * 60), // 24 saat
                redisClient.expire(monthlyKey, 31 * 24 * 60 * 60) // ~1 ay
            ]);

            // Rate limit header'larını ekle
            res.setHeader('X-RateLimit-Limit-Daily', dailyLimit.toString());
            res.setHeader('X-RateLimit-Remaining-Daily', (dailyLimit - dailyCount - 1).toString());
            res.setHeader('X-RateLimit-Limit-Monthly', monthlyLimit.toString());
            res.setHeader('X-RateLimit-Remaining-Monthly', (monthlyLimit - monthlyCount - 1).toString());

            next();
        } catch (error) {
            res.status(401).json({
                error: 'Geçersiz API anahtarı',
                message: 'Lütfen geçerli bir API anahtarı kullanın'
            });
        }
    };
};

// Rate limiter middleware'ini dışa aktar
export const rateLimiter = createRateLimiter(); 