import { Request, Response, NextFunction } from 'express';
import { isIpWhitelisted, isDomainWhitelisted, getClientIp, validateApiKey } from './rateLimiter';

export const intervalAccessControl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const interval = req.query.interval as string;

        // Eğer interval yoksa veya monthly ise direkt geçiş ver
        if (!interval || interval === 'monthly') {
            return next();
        }

        // Sadece daily ve weekly interval'leri için kontrol yap
        if (interval === 'daily' || interval === 'weekly') {
            const clientIp = getClientIp(req);

            // IP whitelist kontrolü
            if (isIpWhitelisted(clientIp) || isDomainWhitelisted(req)) {
                return next();
            }

            // API key kontrolü
            try {
                await validateApiKey(req, false);
                return next();
            } catch (error) {
                return res.status(403).json({
                    error: 'Yetkisiz erişim',
                    message: 'Daily ve weekly interval\'leri sadece yetkili kullanıcılar için erişilebilir'
                });
            }
        }

        // Geçersiz interval değeri
        return res.status(400).json({
            error: 'Geçersiz interval değeri',
            message: 'Interval değeri daily, weekly veya monthly olmalıdır'
        });
    } catch (error) {
        console.error('Interval erişim kontrolü sırasında hata:', error);
        return res.status(500).json({
            error: 'Sunucu hatası',
            message: 'Interval erişim kontrolü sırasında bir hata oluştu'
        });
    }
}; 