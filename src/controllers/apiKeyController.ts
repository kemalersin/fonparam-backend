import { Request, Response } from 'express';
import { ApiKeyService } from '../services/apiKeyService';

export const apiKeyController = {
    // Yeni API key oluştur
    async generateKey(req: Request, res: Response) {
        try {
            const { name, email, description, dailyLimit, monthlyLimit, expiresAt } = req.body;

            // Zorunlu alanları kontrol et
            if (!name || !email) {
                return res.status(400).json({
                    error: 'Eksik bilgi',
                    message: 'İsim ve e-posta adresi zorunludur'
                });
            }

            // E-posta formatını kontrol et
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Geçersiz e-posta',
                    message: 'Lütfen geçerli bir e-posta adresi girin'
                });
            }

            const apiKey = await ApiKeyService.generateKey({
                name,
                email,
                description,
                dailyLimit,
                monthlyLimit,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined
            });

            res.json({
                id: apiKey.id,
                key: apiKey.key,
                name: apiKey.name,
                email: apiKey.email,
                description: apiKey.description,
                daily_limit: apiKey.daily_limit,
                monthly_limit: apiKey.monthly_limit,
                expires_at: apiKey.expires_at,
                created_at: apiKey.created_at
            });
        } catch (error) {
            console.error('API key oluşturulurken hata:', error);
            res.status(500).json({ error: 'API key oluşturulamadı' });
        }
    },

    // API key'i devre dışı bırak
    async deactivateKey(req: Request, res: Response) {
        try {
            const { key } = req.params;
            const success = await ApiKeyService.deactivateKey(key);

            if (success) {
                res.json({ message: 'API key devre dışı bırakıldı' });
            } else {
                res.status(404).json({ error: 'API key bulunamadı' });
            }
        } catch (error) {
            console.error('API key devre dışı bırakılırken hata:', error);
            res.status(500).json({ error: 'API key devre dışı bırakılamadı' });
        }
    },

    // API key limitlerini güncelle
    async updateLimits(req: Request, res: Response) {
        try {
            const { key } = req.params;
            const { dailyLimit, monthlyLimit } = req.body;

            if (!dailyLimit && !monthlyLimit) {
                return res.status(400).json({
                    error: 'Geçersiz istek',
                    message: 'Günlük veya aylık limit belirtilmeli'
                });
            }

            const success = await ApiKeyService.updateLimits(key, {
                dailyLimit: dailyLimit ? Number(dailyLimit) : undefined,
                monthlyLimit: monthlyLimit ? Number(monthlyLimit) : undefined
            });

            if (success) {
                res.json({ message: 'API key limitleri güncellendi' });
            } else {
                res.status(404).json({ error: 'API key bulunamadı' });
            }
        } catch (error) {
            console.error('API key limitleri güncellenirken hata:', error);
            res.status(500).json({ error: 'API key limitleri güncellenemedi' });
        }
    },

    // Aktif API key'leri listele
    async listKeys(req: Request, res: Response) {
        try {
            const keys = await ApiKeyService.listActiveKeys();
            res.json(keys.map(key => ({
                id: key.id,
                name: key.name,
                email: key.email,
                description: key.description,
                daily_limit: key.daily_limit,
                monthly_limit: key.monthly_limit,
                expires_at: key.expires_at,
                created_at: key.created_at
            })));
        } catch (error) {
            console.error('API key\'ler listelenirken hata:', error);
            res.status(500).json({ error: 'API key\'ler listelenemedi' });
        }
    }
}; 