import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

export const cache = new NodeCache();

export const CACHE_DURATIONS = {
    FUNDS_LIST: '5m',      // 5 dakika
    FUND_COMPARE: '5m',    // 5 dakika    
    FUND_DETAIL: '10m',    // 10 dakika
    FUND_HISTORY: '30m',   // 30 dakika
    FUND_ANALYSIS: '30m',   // 30 dakika
    COMPANIES_LIST: '5m',  // 5 dakika
    COMPANY_DETAIL: '10m'  // 10 dakika
} as const;

export const cacheMiddleware = (duration: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        // Response'u intercept et
        const chunks: any[] = [];
        const oldWrite = res.write;
        const oldEnd = res.end;

        res.write = function(chunk: any) {
            chunks.push(chunk);
            return oldWrite.apply(res, arguments as any);
        };

        res.end = function(chunk: any) {
            if (chunk) {
                chunks.push(chunk);
            }

            const body = Buffer.concat(chunks).toString('utf8');
            
            if (res.statusCode === 200) {
                try {
                    const data = JSON.parse(body);
                    const minutes = parseInt(duration);
                    cache.set(key, data, minutes * 60);
                } catch (e) {
                    console.error('Cache parsing error:', e);
                }
            }

            return oldEnd.apply(res, arguments as any);
        };

        next();
    };
};

export const clearCache = (prefix: string): void => {
    const keys = cache.keys();
    keys.forEach(key => {
        if (key.startsWith(prefix)) {
            cache.del(key);
        }
    });
};

export const clearAllCache = (): void => {
    cache.flushAll();
}; 