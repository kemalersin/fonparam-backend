import { Request, Response, NextFunction } from 'express';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.header('X-Admin-Key');
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
            error: 'Yetkisiz erişim',
            message: 'Bu işlem için admin yetkisi gerekiyor'
        });
    }

    next();
}; 