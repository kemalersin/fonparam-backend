import { McpTool, FundComparisonParams } from '../types';
import { Fund, FundYield, FundManagementCompany, FundType, FundHistoricalValue } from '../../models';
import { Op } from 'sequelize';

export const fundComparisonTool: McpTool = {
    name: 'compare_funds',
    description: `Compare 2-5 Turkish mutual funds side by side. 
    Analyzes performance metrics, risk levels, management companies, and fund types.
    
    Example usage:
    - "AAK ve DAH fonlarını karşılaştır"
    - "En iyi hisse senedi fonlarından 3 tanesini karşılaştır: AAK, PKF, XYZ"
    - "Bu fonların risk seviyeleri nasıl?"`,
    
    inputSchema: {
        type: 'object',
        properties: {
            fundCodes: {
                type: 'array',
                description: 'Array of 2-5 Turkish mutual fund codes to compare',
                items: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 10
                },
                minItems: 2,
                maxItems: 5
            },
            metrics: {
                type: 'array',
                description: 'Specific metrics to focus on (optional)',
                items: {
                    type: 'string',
                    enum: [
                        'yield_1d',
                        'yield_1w', 
                        'yield_1m',
                        'yield_3m',
                        'yield_6m',
                        'yield_ytd',
                        'yield_1y',
                        'yield_3y',
                        'yield_5y',
                        'risk_value',
                        'management_fee',
                        'aum'
                    ]
                },
                default: ['yield_1y', 'yield_3y', 'risk_value']
            },
            period: {
                type: 'string',
                description: 'Time period focus for comparison',
                enum: ['short_term', 'medium_term', 'long_term', 'all'],
                default: 'all'
            }
        },
        required: ['fundCodes']
    },

    async execute(params: FundComparisonParams): Promise<string> {
        try {
            console.log('📊 MCP Fund Comparison Request:', {
                fundCodes: params.fundCodes,
                metrics: params.metrics
            });

            // Validate input
            if (!params.fundCodes || params.fundCodes.length < 2 || params.fundCodes.length > 5) {
                return '❌ 2-5 arasında fon kodu belirtmelisiniz.';
            }

            // Normalize fund codes
            const fundCodes = params.fundCodes.map(code => code.toUpperCase().trim());

            // Fetch funds with all related data
            const funds = await Fund.findAll({
                where: { code: { [Op.in]: fundCodes } },
                attributes: ['code', 'title', 'tefas', 'risk_value', 'purchase_value_day', 'sale_value_day', 'management_fee'],
                include: [
                    {
                        model: FundManagementCompany,
                        as: 'management_company',
                        attributes: ['code', 'title', 'logo'],
                        required: true
                    },
                    {
                        model: FundType,
                        as: 'fund_type',
                        required: true
                    },
                    {
                        model: FundYield,
                        as: 'yield',
                        required: true
                    },
                    {
                        model: FundHistoricalValue,
                        as: 'last_historical_value',
                        attributes: ['date', 'value', 'aum', 'investor_count'],
                        required: false
                    }
                ]
            });

            if (funds.length === 0) {
                return `❌ Hiçbir fon bulunamadı. Geçerli fon kodları: ${fundCodes.join(', ')}`;
            }

            if (funds.length !== fundCodes.length) {
                const foundCodes = funds.map(fund => fund.code);
                const missingCodes = fundCodes.filter(code => !foundCodes.includes(code));
                return `❌ Bazı fonlar bulunamadı: ${missingCodes.join(', ')}. Bulunan fonlar: ${foundCodes.join(', ')}`;
            }

            // Sort funds by 1-year performance (best first)
            const sortedFunds = funds.sort((a, b) => {
                const aYield = a.yield?.yield_1y || 0;
                const bYield = b.yield?.yield_1y || 0;
                return bYield - aYield;
            });

            // Generate comparison report
            let response = `📊 **Fon Karşılaştırması** (${funds.length} fon)\n\n`;

            // Performance summary table
            response += `🏆 **Performans Sıralaması (1 Yıllık Getiri):**\n`;
            sortedFunds.forEach((fund, index) => {
                const yield1y = fund.yield?.yield_1y || 0;
                const riskLevel = fund.risk_value || 'N/A';
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📈';
                response += `${emoji} ${fund.code}: %${yield1y.toFixed(2)} (Risk: ${riskLevel})\n`;
            });

            response += `\n📋 **Detaylı Karşılaştırma:**\n\n`;

            // Detailed comparison for each fund
            funds.forEach((fund) => {
                const plainFund = fund.get({ plain: false });
                response += `**${plainFund.code} - ${plainFund.title}**\n`;
                response += `• Şirket: ${plainFund.management_company.title}\n`;
                response += `• Tip: ${plainFund.fund_type.short_name}\n`;
                response += `• TEFAS: ${plainFund.tefas ? '✅' : '❌'}\n`;
                response += `• Risk Seviyesi: ${plainFund.risk_value || 'Belirtilmemiş'}/7\n`;
                response += `• Yönetim Ücreti: %${plainFund.management_fee || 'Belirtilmemiş'}\n`;
                
                if (plainFund.last_historical_value) {
                    response += `• Son Birim Fiyat: ${plainFund.last_historical_value.value.toFixed(4)} TL\n`;
                    if (plainFund.last_historical_value.aum) {
                        response += `• Fon Büyüklüğü: ${(plainFund.last_historical_value.aum / 1_000_000).toFixed(1)}M TL\n`;
                    }
                }

                response += `\n📈 **Getiri Performansı:**\n`;
                if (plainFund.yield) {
                    response += `• 1 Hafta: %${(plainFund.yield.yield_1w || 0).toFixed(2)}\n`;
                    response += `• 1 Ay: %${(plainFund.yield.yield_1m || 0).toFixed(2)}\n`;
                    response += `• 3 Ay: %${(plainFund.yield.yield_3m || 0).toFixed(2)}\n`;
                    response += `• 1 Yıl: %${(plainFund.yield.yield_1y || 0).toFixed(2)}\n`;
                    response += `• 3 Yıl: %${(plainFund.yield.yield_3y || 0).toFixed(2)}\n`;
                }
                response += `\n---\n\n`;
            });

            // Analysis and recommendations
            response += `💡 **Analiz ve Öneriler:**\n`;
            
            // Best performer
            const bestFund = sortedFunds[0];
            response += `🏆 En İyi Performans: ${bestFund.code} (%${(bestFund.yield?.yield_1y || 0).toFixed(2)})\n`;

            // Risk analysis
            const riskLevels = funds.map(f => f.risk_value).filter(r => r != null);
            if (riskLevels.length > 0) {
                const avgRisk = riskLevels.reduce((a, b) => a! + b!, 0)! / riskLevels.length;
                response += `⚖️ Ortalama Risk Seviyesi: ${avgRisk.toFixed(1)}/7\n`;
            }

            // Fund type diversity
            const fundTypes = [...new Set(funds.map(f => f.fund_type?.short_name).filter(name => name))];
            response += `🔄 Fon Tip Çeşitliliği: ${fundTypes.length} farklı tip (${fundTypes.join(', ')})\n`;

            // Performance vs Risk recommendation
            const performanceRiskRatio = sortedFunds.map(fund => ({
                code: fund.code,
                ratio: (fund.yield?.yield_1y || 0) / (fund.risk_value || 5)
            }));
            const bestRatio = performanceRiskRatio.sort((a, b) => b.ratio - a.ratio)[0];
            response += `📊 En İyi Risk/Getiri Oranı: ${bestRatio.code}\n`;

            response += `\n🎯 **Portföy Önerisi:**\n`;
            if (funds.length >= 3) {
                response += `• Ana pozisyon (%50): ${sortedFunds[0].code} (en yüksek getiri)\n`;
                response += `• Dengeleyici pozisyon (%30): ${sortedFunds[1].code}\n`;
                response += `• Risk çeşitlendirme (%20): ${sortedFunds[2].code}\n`;
            } else {
                response += `• ${sortedFunds[0].code}: %60 (daha yüksek getiri)\n`;
                response += `• ${sortedFunds[1].code}: %40 (dengeleme)\n`;
            }

            return response;

        } catch (error) {
            console.error('Fund comparison error:', error);
            
            if (error instanceof Error) {
                return `⚠️ Karşılaştırma hatası: ${error.message}`;
            }
            
            return '❌ Beklenmeyen bir hata oluştu. Lütfen fon kodlarını kontrol edin.';
        }
    }
}; 