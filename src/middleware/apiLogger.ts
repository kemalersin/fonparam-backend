import { Request, Response, NextFunction } from 'express';
import ApiLog from '../models/ApiLog';
import * as ipaddr from 'ipaddr.js';

// Whitelist değerlerini al
const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST_IPS?.split(',') || [];
const whitelistedDomains = process.env.RATE_LIMIT_WHITELIST_DOMAINS?.split(',') || [];

// IP'nin whitelist'te olup olmadığını kontrol et
const isIpWhitelisted = (ip: string): boolean => {
    const addr: ipaddr.IPv4 = <ipaddr.IPv4>ipaddr.parse(ip.trim());

    return whitelistedIPs.some(whitelistedIp => {
        try {
            if (whitelistedIp.includes('/')) {
                // CIDR notasyonu için kontrol
                const [range, bits] = whitelistedIp.split('/');
                const rangeAddr: ipaddr.IPv4 = <ipaddr.IPv4>ipaddr.parse(range);
                return addr.match(rangeAddr, parseInt(bits));
            } else {
                // Tek IP için kontrol
                return ip.trim() === whitelistedIp.trim();
            }
        } catch {
            return false;
        }
    });
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

// Loglanmayacak URL'leri kontrol et
const shouldSkipLogging = (url: string): boolean => {
    // Loglanmayacak URL pattern'leri
    const skipPatterns = [
        '/public',  // Statik dosyalar
        '/api-docs' // Swagger UI ve dökümantasyon
    ];

    // Herhangi bir pattern ile eşleşiyorsa loglama
    return skipPatterns.some(pattern => url.startsWith(pattern));
};

export const apiLogger = async (req: Request, res: Response, next: NextFunction) => {
    // Loglanmayacak URL kontrolü
    if (shouldSkipLogging(req.originalUrl)) {
        return next();
    }

    const startTime = Date.now();
    const originalEnd = res.end;
    const originalJson = res.json;
    let isLogged = false;

    // IP adresini al
    const ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        req.ip ||
        'unknown';

    // API key'i al
    const apiKey = req.header('X-API-Key');

    // Whitelist kontrolü
    const isWhitelisted = isIpWhitelisted(Array.isArray(ip) ? ip[0] : ip.toString()) || isDomainWhitelisted(req);

    // Log kaydı oluştur
    const createLog = (responseTime: number) => {
        if (isLogged) return; // Eğer zaten log kaydı oluşturulduysa çık
        isLogged = true;

        ApiLog.create({
            ip_address: Array.isArray(ip) ? ip[0] : ip,
            api_key: apiKey || null,
            endpoint: req.originalUrl,
            method: req.method,
            status_code: res.statusCode,
            response_time: responseTime,
            is_whitelisted: isWhitelisted
        }).catch(err => {
            console.error('API log kaydedilirken hata:', err);
        });
    };

    // Response'u yakala
    res.json = function (body) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        createLog(responseTime);
        return originalJson.call(this, body);
    };

    res.end = function (chunk?: any, cb?: (() => void) | BufferEncoding, callback?: () => void) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        createLog(responseTime);
        return originalEnd.call(this, chunk, cb as BufferEncoding, callback);
    };

    next();
}; 