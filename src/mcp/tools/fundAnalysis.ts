import { McpTool, FundAnalysisParams } from '../types';
import investmentAnalysisService from '../../services/investmentAnalysisService';
import { StartDate } from '../../interfaces/investmentAnalysis';

export const fundAnalysisTool: McpTool = {
    name: 'analyze_fund_investment',
    description: `Comprehensive investment analysis for Turkish mutual funds. 
    Calculates nominal and real returns, inflation impact, period-by-period breakdown.
    
    Example usage:
    - "AAK fonu ile 10.000 TL başlangıç ve 1.000 TL aylık yatırım yapsam, son 1 yılda nasıl bir getiri elde ederim?"
    - "Enflasyon etkisi hesaba katıldığında reel getirim ne olur?"`,
    
    inputSchema: {
        type: 'object',
        properties: {
            fundCode: {
                type: 'string',
                description: 'Turkish mutual fund code (e.g., AAK, DAH, PKF)',
                minLength: 2,
                maxLength: 10
            },
            initialInvestment: {
                type: 'number',
                description: 'Initial investment amount in Turkish Lira',
                minimum: 100
            },
            monthlyInvestment: {
                type: 'number',
                description: 'Monthly recurring investment amount (optional)',
                minimum: 0,
                default: 0
            },
            startDate: {
                type: 'string',
                description: 'Investment period',
                enum: [
                    'last_1_day',
                    'last_1_week', 
                    'last_1_month',
                    'last_3_months',
                    'last_6_months',
                    'last_1_year',
                    'last_3_years',
                    'last_5_years',
                    'year_start'
                ],
                default: 'last_1_year'
            },
            yearlyIncrease: {
                type: 'object',
                description: 'Yearly increase in monthly investment (optional)',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['percentage', 'amount'],
                        description: 'Type of yearly increase'
                    },
                    value: {
                        type: 'number',
                        minimum: 0,
                        description: 'Increase value (% for percentage, TL for amount)'
                    }
                },
                required: ['type', 'value']
            },
            includeMonthlyDetails: {
                type: 'boolean',
                description: 'Include month-by-month breakdown',
                default: true
            }
        },
        required: ['fundCode', 'initialInvestment', 'startDate']
    },

    async execute(params: FundAnalysisParams): Promise<string> {
        try {
            console.log('🔍 MCP Fund Analysis Request:', {
                fundCode: params.fundCode,
                initialInvestment: params.initialInvestment,
                startDate: params.startDate
            });

            // Validate startDate enum
            if (!Object.values(StartDate).includes(params.startDate as StartDate)) {
                throw new Error(`Invalid startDate. Must be one of: ${Object.values(StartDate).join(', ')}`);
            }

            // Call existing investment analysis service
            const analysisRequest = {
                fundCode: params.fundCode.toUpperCase(),
                startDate: params.startDate as StartDate,
                initialInvestment: params.initialInvestment,
                monthlyInvestment: params.monthlyInvestment || 0,
                yearlyIncrease: params.yearlyIncrease,
                includeMonthlyDetails: params.includeMonthlyDetails ?? true
            };

            const result = await investmentAnalysisService.analyze(analysisRequest);

            // Format response for AI consumption
            const response = `
📊 **${result.title}** (${result.code}) Yatırım Analizi

💰 **Finansal Özet:**
• Toplam Yatırım: ${result.summary.totalInvestment.toLocaleString('tr-TR')} TL
• Güncel Değer: ${result.summary.currentValue.toLocaleString('tr-TR')} TL
• Nominal Getiri: ${result.summary.totalYield.toLocaleString('tr-TR')} TL (%${result.summary.totalYieldPercentage.toFixed(2)})

📈 **Enflasyon Analizi:**
• Kümülatif Enflasyon: %${result.summary.cumulativeInflation.toFixed(2)}
• Reel Getiri: ${result.summary.realTotalYield.toLocaleString('tr-TR')} TL (%${result.summary.realTotalYieldPercentage.toFixed(2)})

⚖️ **Analiz Değerlendirmesi:**
${result.summary.realTotalYieldPercentage > 0 
    ? `✅ Yatırım enflasyonu ${result.summary.realTotalYieldPercentage.toFixed(2)} puan geride bıraktı.`
    : `⚠️ Yatırım enflasyonun ${Math.abs(result.summary.realTotalYieldPercentage).toFixed(2)} puan gerisinde kaldı.`}

${result.summary.totalYieldPercentage > 30 
    ? '🚀 Excellent performance - well above market average'
    : result.summary.totalYieldPercentage > 15 
    ? '👍 Good performance - above market average'
    : result.summary.totalYieldPercentage > 0 
    ? '📊 Moderate performance'
    : '📉 Negative performance - consider alternatives'}

${params.includeMonthlyDetails && result.periodDetails ? `
📅 **Dönemsel Detaylar:** (İlk 5 ve son 5 dönem)
${result.periodDetails.slice(0, 5).concat(result.periodDetails.slice(-5)).map((detail, index) => 
`${detail.date}: ${detail.value.toLocaleString('tr-TR')} TL (${detail.totalYieldPercentage.toFixed(2)}%)`
).join('\n')}` : ''}

💡 **Yatırım Tavsiyeleri:**
${result.summary.realTotalYieldPercentage < 0 
    ? '• Enflasyonun altında getiri aldınız. Daha yüksek getirili fonları değerlendirin.'
    : '• Enflasyonun üzerinde reel getiri elde ettiniz. İyi bir seçim.'}
• Risk diversifikasyonu için portföyünüzü gözden geçirin.
• Düzenli yatırım yaparak dolar cost averaging avantajından yararlanın.
`;

            return response;

        } catch (error) {
            console.error('Fund analysis error:', error);
            
            if (error instanceof Error) {
                if (error.message.includes('bulunamadı')) {
                    return `❌ Fon bulunamadı: "${params.fundCode}". Lütfen geçerli bir Türk fon kodu girin (örn: AAK, DAH, PKF).`;
                }
                if (error.message.includes('veri bulunamadı')) {
                    return `📅 Belirtilen dönem için veri bulunamadı. Farklı bir dönem deneyin.`;
                }
                return `⚠️ Analiz hatası: ${error.message}`;
            }
            
            return '❌ Beklenmeyen bir hata oluştu. Lütfen parametreleri kontrol edin.';
        }
    }
}; 