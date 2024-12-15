import crypto from 'crypto';
import ApiKey from '../models/ApiKey';

interface GenerateKeyParams {
    name: string;
    email: string;
    description?: string;
    dailyLimit?: number;
    monthlyLimit?: number;
    expiresAt?: Date;
}

interface UpdateLimitsParams {
    dailyLimit?: number;
    monthlyLimit?: number;
}

export class ApiKeyService {
    // Yeni API key oluştur
    static async generateKey(params: GenerateKeyParams): Promise<ApiKey> {
        const key = crypto.randomBytes(32).toString('hex');
        
        return await ApiKey.create({
            key,
            name: params.name,
            email: params.email,
            description: params.description,
            daily_limit: params.dailyLimit || 100,
            monthly_limit: params.monthlyLimit || 3000,
            expires_at: params.expiresAt
        });
    }

    // API key'i doğrula
    static async validateKey(key: string): Promise<ApiKey | null> {
        const apiKey = await ApiKey.findOne({
            where: {
                key,
                is_active: true
            }
        });

        if (!apiKey) {
            return null;
        }

        // Süre kontrolü
        if (apiKey.expires_at && apiKey.expires_at < new Date()) {
            await apiKey.update({ is_active: false });
            return null;
        }

        return apiKey;
    }

    // API key'i devre dışı bırak
    static async deactivateKey(key: string): Promise<boolean> {
        const result = await ApiKey.update(
            { is_active: false },
            { where: { key } }
        );
        return result[0] > 0;
    }

    // API key limitlerini güncelle
    static async updateLimits(key: string, params: UpdateLimitsParams): Promise<boolean> {
        const updateData: any = {};
        
        if (params.dailyLimit !== undefined) {
            updateData.daily_limit = params.dailyLimit;
        }
        
        if (params.monthlyLimit !== undefined) {
            updateData.monthly_limit = params.monthlyLimit;
        }

        const result = await ApiKey.update(
            updateData,
            { where: { key } }
        );
        return result[0] > 0;
    }

    // API key'in son kullanma tarihini güncelle
    static async updateExpiryDate(key: string, newExpiryDate: Date): Promise<boolean> {
        const result = await ApiKey.update(
            { expires_at: newExpiryDate },
            { where: { key } }
        );
        return result[0] > 0;
    }

    // Tüm aktif API key'leri listele
    static async listActiveKeys(): Promise<ApiKey[]> {
        return await ApiKey.findAll({
            where: {
                is_active: true
            },
            order: [['created_at', 'DESC']]
        });
    }
} 