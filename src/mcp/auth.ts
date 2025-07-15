import { ApiKeyService } from '../services/apiKeyService';
import { validateApiKey, isIpWhitelisted, isDomainWhitelisted } from '../middleware/rateLimiter';

export interface McpAuthContext {
    isAuthenticated: boolean;
    apiKey?: string;
    dailyLimit: number;
    monthlyLimit: number;
    ipAddress?: string;
    isWhitelisted: boolean;
    userId?: string;
}

export class McpAuthBridge {
    /**
     * Validate MCP request authentication
     * @param headers Request headers containing potential auth info
     * @param clientInfo Client connection information
     */
    static async authenticate(
        headers: Record<string, string | undefined> = {},
        clientInfo: { ipAddress?: string; userAgent?: string } = {}
    ): Promise<McpAuthContext> {
        
        const authContext: McpAuthContext = {
            isAuthenticated: false,
            dailyLimit: 100,
            monthlyLimit: 3000,
            ipAddress: clientInfo.ipAddress,
            isWhitelisted: false
        };

        try {
            // 1. IP Whitelist kontrolü
            if (clientInfo.ipAddress) {
                authContext.isWhitelisted = isIpWhitelisted(clientInfo.ipAddress);
                
                if (authContext.isWhitelisted) {
                    authContext.isAuthenticated = true;
                    authContext.dailyLimit = 999999; // Unlimited for whitelisted
                    authContext.monthlyLimit = 999999;
                    return authContext;
                }
            }

            // 2. API Key kontrolü
            const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');
            
            if (apiKey) {
                try {
                    const validatedKey = await ApiKeyService.validateKey(apiKey);
                    
                    if (validatedKey) {
                        authContext.isAuthenticated = true;
                        authContext.apiKey = apiKey;
                        authContext.dailyLimit = validatedKey.daily_limit;
                        authContext.monthlyLimit = validatedKey.monthly_limit;
                        authContext.userId = validatedKey.id;
                        return authContext;
                    }
                } catch (error) {
                    console.log('API key validation error:', error);
                }
            }

            // 3. Anonymous access (limited)
            authContext.isAuthenticated = true; // Allow anonymous with limits
            authContext.dailyLimit = 25;  // Very limited for anonymous
            authContext.monthlyLimit = 100;
            
            return authContext;

        } catch (error) {
            console.error('MCP Authentication error:', error);
            return authContext;
        }
    }

    /**
     * Check if user has permission for specific MCP operation
     */
    static hasPermission(authContext: McpAuthContext, operation: string): boolean {
        // Whitelisted users have all permissions
        if (authContext.isWhitelisted) {
            return true;
        }

        // Authenticated users with API keys have extended permissions
        if (authContext.apiKey) {
            return true;
        }

        // Anonymous users have limited permissions
        const allowedOperations = [
            'analyze_fund_investment',
            'compare_funds',
            'get_market_insights'
        ];

        return allowedOperations.includes(operation);
    }

    /**
     * Get rate limit information for user
     */
    static getRateLimitInfo(authContext: McpAuthContext): {
        dailyLimit: number;
        monthlyLimit: number;
        tier: 'anonymous' | 'authenticated' | 'whitelisted';
    } {
        if (authContext.isWhitelisted) {
            return {
                dailyLimit: authContext.dailyLimit,
                monthlyLimit: authContext.monthlyLimit,
                tier: 'whitelisted'
            };
        }

        if (authContext.apiKey) {
            return {
                dailyLimit: authContext.dailyLimit,
                monthlyLimit: authContext.monthlyLimit,
                tier: 'authenticated'
            };
        }

        return {
            dailyLimit: authContext.dailyLimit,
            monthlyLimit: authContext.monthlyLimit,
            tier: 'anonymous'
        };
    }

    /**
     * Generate authentication recommendations for unauthenticated users
     */
    static getAuthRecommendations(authContext: McpAuthContext): string {
        if (authContext.isAuthenticated && authContext.apiKey) {
            return '';
        }

        if (authContext.isWhitelisted) {
            return '✅ IP adresiniz whitelist\'te bulunuyor. Sınırsız erişiminiz var.';
        }

        return `
🔑 **API Erişimi Önerileri:**

📊 **Mevcut Durumunuz:** Anonymous User
• Günlük Limit: ${authContext.dailyLimit} istek
• Aylık Limit: ${authContext.monthlyLimit} istek

🚀 **Daha Fazla Erişim İçin:**
• API anahtarı almak için: /api-keys endpoint'ini kullanın
• API anahtarı ile günlük 100+ istek hakkı
• Gelişmiş analizler ve özel raporlar
• Rate limit muafiyeti

💡 **API Key Kullanımı:**
• Header: X-API-Key: your_api_key_here
• Veya Authorization: Bearer your_api_key_here

📧 **Kurumsal Erişim:** mail@kemalersin.com
`;
    }
}

export default McpAuthBridge; 