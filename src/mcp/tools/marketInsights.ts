import { McpTool, MarketInsightsParams } from '../types';
import { 
    Fund, 
    FundYield, 
    FundManagementCompany, 
    FundType, 
    FundTypeYields,
    DailyStatistics 
} from '../../models';
import { Op, literal } from 'sequelize';

export const marketInsightsTool: McpTool = {
    name: 'get_market_insights',
    description: `Get comprehensive Turkish mutual fund market insights and trends.
    Provides market overview, best performing funds, fund type analysis, and investment recommendations.
    
    Example usage:
    - "Bugün fon piyasası nasıl?"
    - "En iyi performans gösteren hisse senedi fonları hangileri?"
    - "Hangi fon tipine yatırım yapmak daha mantıklı?"
    - "Piyasa trendi nasıl?"`,
    
    inputSchema: {
        type: 'object',
        properties: {
            fundType: {
                type: 'string',
                description: 'Specific fund type to analyze (optional)',
                enum: [
                    'altin',
                    'borclanma_araclari',
                    'degisken',
                    'fon_sepeti',
                    'gumus',
                    'hisse_senedi',
                    'hisse_senedi_yogun',
                    'karma',
                    'katilim',
                    'kiymetli_madenler',
                    'para_piyasasi',
                    'serbest',
                    'yabanci',
                    'diger'
                ]
            },
            timeframe: {
                type: 'string',
                description: 'Analysis timeframe',
                enum: ['daily', 'weekly', 'monthly', 'yearly'],
                default: 'monthly'
            },
            limit: {
                type: 'number',
                description: 'Number of top funds to include',
                minimum: 5,
                maximum: 20,
                default: 10
            }
        },
        required: []
    },

    async execute(params: MarketInsightsParams): Promise<string> {
        try {
            console.log('📈 MCP Market Insights Request:', params);

            const limit = params.limit || 10;
            let response = `📊 **Türk Fon Piyasası Analizi**\n\n`;

            // 1. Market Overview - Latest Statistics
            try {
                const latestStats = await DailyStatistics.findOne({
                    order: [['date', 'DESC']]
                });

                if (latestStats) {
                    response += `📅 **Piyasa Genel Durumu** (${latestStats.date}):\n`;
                    response += `• Toplam Fon Sayısı: ${latestStats.total_funds.toLocaleString('tr-TR')}\n`;
                    response += `• Aktif Şirket Sayısı: ${latestStats.total_companies.toLocaleString('tr-TR')}\n`;
                    response += `• Toplam Yatırımcı: ${latestStats.total_investors.toLocaleString('tr-TR')}\n`;
                    response += `• Toplam Fon Büyüklüğü: ${(Number(latestStats.total_aum) / 1_000_000_000).toFixed(1)}B TL\n`;
                    response += `• Ortalama Kazanç: %${Number(latestStats.avg_profit).toFixed(2)}\n`;
                    response += `• Ortalama Kayıp: %${Number(latestStats.avg_loss).toFixed(2)}\n\n`;
                }
            } catch (error) {
                console.log('Stats error:', error);
            }

            // 2. Fund Type Performance
            try {
                const fundTypePerformance = await FundTypeYields.findAll({
                    include: [{
                        model: FundType,
                        as: 'fund_type',
                        required: true
                    }],
                    where: params.fundType ? { type: params.fundType } : {},
                    order: [['yield_1y', 'DESC']]
                });

                if (fundTypePerformance.length > 0) {
                    response += `🏆 **Fon Tipi Performans Sıralaması (1 Yıllık):**\n`;
                    fundTypePerformance.slice(0, 8).forEach((typeYield, index) => {
                        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
                        const yield1y = typeYield.yield_1y ? Number(typeYield.yield_1y).toFixed(2) : 'N/A';
                        const totalFunds = typeYield.total_funds || 0;
                        const fundTypeName = (typeYield as any).fund_type?.short_name || 'Unknown';
                        response += `${emoji} ${fundTypeName}: %${yield1y} (${totalFunds} fon)\n`;
                    });
                    response += `\n`;
                }
            } catch (error) {
                console.log('Fund type performance error:', error);
            }

            // 3. Top Performing Funds
            try {
                const whereCondition: any = {};
                if (params.fundType) {
                    whereCondition.type = params.fundType;
                }

                const topFunds = await Fund.findAll({
                    attributes: ['code', 'title', 'tefas'],
                    include: [
                        {
                            model: FundYield,
                            as: 'yield',
                            where: {
                                yield_1y: { 
                                    [Op.not]: null,
                                    [Op.gt]: 0 
                                }
                            },
                            required: true
                        },
                        {
                            model: FundType,
                            as: 'fund_type',
                            where: whereCondition,
                            required: true
                        },
                        {
                            model: FundManagementCompany,
                            as: 'management_company',
                            attributes: ['title'],
                            required: true
                        }
                    ],
                    order: [[{ model: FundYield, as: 'yield' }, 'yield_1y', 'DESC']],
                    limit: limit
                });

                if (topFunds.length > 0) {
                    const typeFilter = params.fundType ? ` (${params.fundType.toUpperCase()})` : '';
                    response += `🚀 **En İyi Performanslı Fonlar${typeFilter}:**\n`;
                    topFunds.forEach((fund, index) => {
                        const plainFund = fund.get({ plain: false });
                        const yield1y = plainFund.yield?.yield_1y ? Number(plainFund.yield.yield_1y).toFixed(2) : '0';
                        const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '⭐';
                        response += `${emoji} ${fund.code}: %${yield1y} - ${fund.title.substring(0, 40)}...\n`;
                        response += `    📍 ${plainFund.management_company?.title} • TEFAS: ${fund.tefas ? '✅' : '❌'}\n`;
                    });
                    response += `\n`;
                }
            } catch (error) {
                console.log('Top funds error:', error);
            }

            // 4. Market Trends Analysis
            try {
                const performanceRanges = await FundYield.findAll({
                    attributes: [
                        [literal(`CASE 
                            WHEN yield_1y > 50 THEN 'Excellent (>50%)'
                            WHEN yield_1y > 30 THEN 'Very Good (30-50%)'
                            WHEN yield_1y > 15 THEN 'Good (15-30%)'
                            WHEN yield_1y > 0 THEN 'Moderate (0-15%)'
                            ELSE 'Negative (<0%)'
                        END`) as any, 'performance_range'],
                        [literal('COUNT(*)') as any, 'fund_count']
                    ],
                    where: {
                        yield_1y: { [Op.not]: null }
                    },
                    group: [literal(`CASE 
                        WHEN yield_1y > 50 THEN 'Excellent (>50%)'
                        WHEN yield_1y > 30 THEN 'Very Good (30-50%)'
                        WHEN yield_1y > 15 THEN 'Good (15-30%)'
                        WHEN yield_1y > 0 THEN 'Moderate (0-15%)'
                        ELSE 'Negative (<0%)'
                    END`) as any],
                    raw: true
                });

                if (performanceRanges.length > 0) {
                    response += `📊 **Piyasa Performans Dağılımı (1 Yıllık):**\n`;
                    performanceRanges.forEach((range: any) => {
                        const count = Number(range.fund_count);
                        response += `• ${range.performance_range}: ${count} fon\n`;
                    });
                    response += `\n`;
                }
            } catch (error) {
                console.log('Performance ranges error:', error);
            }

            // 5. Investment Recommendations
            response += `💡 **Yatırım Önerileri:**\n`;

            try {
                const riskAdjustedFunds = await Fund.findAll({
                    attributes: ['code', 'title', 'risk_value'],
                    include: [
                        {
                            model: FundYield,
                            as: 'yield',
                            where: {
                                yield_1y: { 
                                    [Op.not]: null,
                                    [Op.gt]: 15 
                                }
                            },
                            required: true
                        },
                        {
                            model: FundType,
                            as: 'fund_type',
                            required: true
                        }
                    ],
                    where: {
                        risk_value: { 
                            [Op.not]: null,
                            [Op.lte]: 4
                        }
                    },
                    order: [[{ model: FundYield, as: 'yield' }, 'yield_1y', 'DESC']],
                    limit: 3
                });

                if (riskAdjustedFunds.length > 0) {
                    response += `🎯 **Düşük-Orta Risk, Yüksek Getiri Fonları:**\n`;
                    riskAdjustedFunds.forEach(fund => {
                        const plainFund = fund.get({ plain: false });
                        const yield1y = plainFund.yield?.yield_1y ? Number(plainFund.yield.yield_1y).toFixed(2) : '0';
                        response += `• ${fund.code}: %${yield1y} (Risk: ${fund.risk_value}/7)\n`;
                    });
                    response += `\n`;
                }

                // Market timing advice based on recent performance
                const recentPerformance: any = await FundYield.findOne({
                    attributes: [
                        [literal('AVG(yield_1w)'), 'avg_weekly'],
                        [literal('AVG(yield_1m)'), 'avg_monthly']
                    ],
                    where: {
                        yield_1w: { [Op.not]: null },
                        yield_1m: { [Op.not]: null }
                    },
                    raw: true
                });

                if (recentPerformance) {
                    const weeklyAvg = Number(recentPerformance.avg_weekly);
                    const monthlyAvg = Number(recentPerformance.avg_monthly);
                    
                    response += `⏰ **Piyasa Zamanlaması:**\n`;
                    if (weeklyAvg > 0 && monthlyAvg > 0) {
                        response += `📈 Piyasa pozitif trend gösteriyor. Yatırım için uygun zaman.\n`;
                    } else if (weeklyAvg < 0 && monthlyAvg < 0) {
                        response += `📉 Piyasa negatif trend gösteriyor. Temkinli yaklaşım öneriliyor.\n`;
                    } else {
                        response += `⚖️ Piyasa karışık sinyaller veriyor. Dollar-cost averaging stratejisi öneriliyor.\n`;
                    }
                }

            } catch (error) {
                console.log('Recommendations error:', error);
            }

            response += `\n📝 **Genel Tavsiyeler:**\n`;
            response += `• Portföyünüzü farklı fon tipleri arasında diversifiye edin\n`;
            response += `• Risk toleransınıza uygun fonları seçin\n`;
            response += `• Düzenli yatırım yaparak volatiliteden korunun\n`;
            response += `• Yönetim ücretlerini karşılaştırın\n`;
            response += `• TEFAS'ta işlem gören fonları tercih edin\n`;

            return response;

        } catch (error) {
            console.error('Market insights error:', error);
            
            if (error instanceof Error) {
                return `⚠️ Piyasa analizi hatası: ${error.message}`;
            }
            
            return '❌ Piyasa verileri alınırken beklenmeyen bir hata oluştu.';
        }
    }
}; 