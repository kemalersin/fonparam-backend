import { FundHistoricalValue, FundYield, Fund } from '../models';
import { InvestmentAnalysisRequest, InvestmentAnalysisResponse, StartDate, YearlyIncrease, InvestmentAnalysisSummary, PeriodDetail } from '../interfaces/investmentAnalysis';
import { Op, literal } from 'sequelize';

class InvestmentAnalysisService {
    /**
     * Başlangıç tarihini hesaplar
     * @param startDate Başlangıç tarihi tipi
     * @param endDate Bitiş tarihi
     */
    private getStartDate(startDate: StartDate, endDate: Date): Date {
        // Başlangıç tarihini hesapla
        let targetDate = new Date(endDate);
        targetDate.setHours(0, 0, 0, 0); // Günün başlangıcına ayarla

        switch (startDate) {
            case StartDate.last_1_day:
                targetDate.setDate(targetDate.getDate() - 1);
                break;
            case StartDate.last_1_week:
                targetDate.setDate(targetDate.getDate() - 7);
                break;
            case StartDate.last_1_month:
                targetDate.setMonth(targetDate.getMonth() - 1);
                break;
            case StartDate.last_3_months:
                targetDate.setMonth(targetDate.getMonth() - 2);
                break;
            case StartDate.last_6_months:
                targetDate.setMonth(targetDate.getMonth() - 5);
                break;
            case StartDate.last_1_year:
                targetDate.setFullYear(targetDate.getFullYear() - 1);
                break;
            case StartDate.last_3_years:
                targetDate.setFullYear(targetDate.getFullYear() - 3);
                break;
            case StartDate.last_5_years:
                targetDate.setFullYear(targetDate.getFullYear() - 5);
                break;
            case StartDate.year_start:
                return new Date(targetDate.getFullYear(), 0, 1);
            default:
                throw new Error('Geçersiz başlangıç tarihi');
        }

        return targetDate;
    }

    /**
     * Aylık yatırım miktarını hesaplar
     */
    private calculateMonthlyInvestment(
        baseAmount: number,
        currentDate: Date,
        startDate: Date,
        yearlyIncrease?: YearlyIncrease
    ): number {
        // İlk ay kontrolü
        if (currentDate.getFullYear() === startDate.getFullYear() &&
            currentDate.getMonth() === startDate.getMonth()) {
            return 0;
        }

        // Artış yoksa temel miktar
        if (!yearlyIncrease?.type || !yearlyIncrease?.value || yearlyIncrease.value === 0) {
            return baseAmount;
        }

        // Yatırımın başlangıç tarihi ile şu anki tarih arasında kaç yıl geçtiğini hesapla
        const currentTime = currentDate.getTime();
        const startTime = startDate.getTime();
        const yearInMilliseconds = 365.25 * 24 * 60 * 60 * 1000; // Artık yılları da hesaba kat
        const yearsPassed = Math.floor((currentTime - startTime) / yearInMilliseconds);

        // Yıllık artışı uygula
        if (yearsPassed > 0) {
            if (yearlyIncrease.type === 'percentage') {
                // Her yıl için bileşik faiz formülünü uygula
                const multiplier = Math.pow(1 + (yearlyIncrease.value / 100), yearsPassed);
                return Math.round(baseAmount * multiplier);
            } else {
                // Sabit artış
                return baseAmount + (yearlyIncrease.value * yearsPassed);
            }
        }

        return baseAmount;
    }

    // Kısa dönem analizi mi kontrol et
    isShortTermAnalysis = (startDate: StartDate): boolean => {
        return startDate === StartDate.last_1_day || startDate === StartDate.last_1_week;
    };

    // Periyot tipini belirle
    getPeriodType = (startDate: StartDate): 'daily' | 'monthly' => {
        return this.isShortTermAnalysis(startDate) ? 'daily' : 'monthly';
    };

    // Geçmiş verileri çek
    getHistoricalData = async (
        code: string,
        startDate: Date,
        periodType: 'daily' | 'monthly'
    ): Promise<FundHistoricalValue[]> => {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // Günün sonuna ayarla

        // Günlük veri için direkt tüm kayıtları al
        if (periodType === 'daily') {
            // Önce başlangıç tarihinden sonraki ilk veriyi bul
            const firstRecord = await FundHistoricalValue.findOne({
                where: {
                    code,
                    date: {
                        [Op.gte]: startDate
                    }
                },
                order: [['date', 'ASC']]
            });

            if (!firstRecord) {
                throw new Error('Başlangıç tarihinden sonra veri bulunamadı');
            }

            // Bulunan ilk kayıttan itibaren tüm verileri getir
            return await FundHistoricalValue.findAll({
                where: {
                    code,
                    date: {
                        [Op.gte]: firstRecord.date,
                        [Op.lte]: endDate
                    }
                },
                order: [['date', 'ASC']]
            });
        }

        // Aylık veri için her ayın hedef güne en yakın verisini al
        const targetDay = startDate.getDate(); // Hedef gün
        const subQuery = `
            WITH monthly_data AS (
                SELECT 
                    code,
                    date,
                    DATE_FORMAT(date, '%Y-%m') as month_group,
                    ABS(DAY(date) - :targetDay) as day_diff,
                    ROW_NUMBER() OVER (
                        PARTITION BY code, DATE_FORMAT(date, '%Y-%m') 
                        ORDER BY ABS(DAY(date) - :targetDay), date ASC
                    ) as rn
                FROM fund_historical_values
                WHERE code = :code 
                AND date >= :startDate 
                AND date <= :endDate
            )
            SELECT code, date
            FROM monthly_data
            WHERE rn = 1
        `;

        return await FundHistoricalValue.findAll({
            where: {
                [Op.and]: [
                    literal(`(code, date) IN (${subQuery})`),
                    { code }
                ]
            },
            order: [['date', 'ASC']],
            replacements: { 
                code,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                targetDay
            }
        });
    };

    // Analiz hesapla
    calculateAnalysis = (
        historicalData: FundHistoricalValue[],
        periodType: 'daily' | 'monthly',
        initialInvestment: number,
        monthlyInvestment: number,
        yearlyIncrease?: YearlyIncrease
    ): {
        summary: InvestmentAnalysisSummary;
        periodDetails: PeriodDetail[];
    } => {
        const periodDetails: PeriodDetail[] = [];
        let totalInvestment = initialInvestment;
        let totalUnits = 0;

        // İlk değeri al
        const firstValue = historicalData[0];
        if (!firstValue) {
            throw new Error('Geçmiş veri bulunamadı');
        }

        // İlk yatırımı yap
        totalUnits = initialInvestment / firstValue.value;

        // İlk yatırım tarihini al
        const firstInvestmentDate = new Date(firstValue.date);
        const firstInvestmentDay = firstInvestmentDate.getDate();
        const firstInvestmentMonth = firstInvestmentDate.getMonth();

        // Her dönem için hesapla
        for (let i = 0; i < historicalData.length; i++) {
            const current = historicalData[i];
            const prev = i > 0 ? historicalData[i - 1] : null;
            const currentDate = new Date(current.date);

            // Yatırım miktarını hesapla
            let periodInvestment = 0;

            // İlk kayıt değilse ve ay değişmişse ek yatırım yap
            if (prev) {
                const currentMonth = currentDate.getMonth();
                const prevDate = new Date(prev.date);
                const prevMonth = prevDate.getMonth();

                // Ay değiştiğinde yatırım yap
                if (currentMonth !== prevMonth) {
                    // Yıllık artışı hesapla
                    const currentDay = currentDate.getDate();
                    const isAnniversaryMonth = currentMonth === firstInvestmentMonth;
                    const isOnOrAfterAnniversaryDay = currentDay >= firstInvestmentDay;
                    const yearsPassed = currentDate.getFullYear() - firstInvestmentDate.getFullYear() - 
                        (isAnniversaryMonth && isOnOrAfterAnniversaryDay || currentMonth > firstInvestmentMonth ? 0 : 1);

                    let adjustedMonthlyInvestment = monthlyInvestment;
                    if (yearlyIncrease && yearsPassed > 0) {
                        if (yearlyIncrease.type === 'percentage') {
                            const multiplier = Math.pow(1 + (yearlyIncrease.value / 100), yearsPassed);
                            adjustedMonthlyInvestment = Math.round(monthlyInvestment * multiplier);
                        } else {
                            adjustedMonthlyInvestment = monthlyInvestment + (yearlyIncrease.value * yearsPassed);
                        }
                    }

                    periodInvestment = adjustedMonthlyInvestment;
                    totalInvestment += periodInvestment;
                    totalUnits += periodInvestment / current.value;
                }
            }

            // Değerleri hesapla
            const currentValue = totalUnits * current.value;
            const periodChange = prev ? currentValue - (totalUnits * prev.value) : 0;
            const periodChangePercentage = prev ? ((current.value - prev.value) / prev.value) * 100 : 0;
            const totalYield = currentValue - totalInvestment;
            const totalYieldPercentage = (totalYield / totalInvestment) * 100;

            // Dönem detayını ekle
            periodDetails.push({
                date: currentDate.toISOString().split('T')[0],
                investment: periodInvestment,
                totalInvestment,
                unitPrice: current.value,
                units: i === 0 ? totalUnits : (periodType === 'daily' ? totalUnits : (periodInvestment > 0 ? periodInvestment / current.value : 0)),
                totalUnits,
                value: currentValue,
                periodChange,
                periodChangePercentage,
                totalYield,
                totalYieldPercentage
            });
        }

        // Son değerleri al
        const lastDetail = periodDetails[periodDetails.length - 1];

        return {
            summary: {
                totalInvestment,
                currentValue: lastDetail.value,
                totalYield: lastDetail.totalYield,
                totalYieldPercentage: lastDetail.totalYieldPercentage
            },
            periodDetails
        };
    };

    async analyze(request: InvestmentAnalysisRequest): Promise<InvestmentAnalysisResponse> {
        try {
            const { fundCode, startDate, initialInvestment, monthlyInvestment, yearlyIncrease, includeMonthlyDetails } = request;

            // Fon bilgilerini getir
            const fund = await Fund.findByPk(fundCode, {
                include: [{
                    model: FundYield,
                    as: 'yield',
                    required: true
                }]
            });
            if (!fund) {
                throw new Error('Fon bulunamadı');
            }

            // Başlangıç tarihini belirle
            const startDateValue = this.getStartDate(startDate, new Date());

            // Periyot tipini belirle
            const periodType = this.getPeriodType(startDate);

            // Geçmiş verileri çek
            const historicalData = await this.getHistoricalData(fundCode, startDateValue, periodType);

            // Analizi hesapla
            const analysis = this.calculateAnalysis(
                historicalData,
                periodType,
                initialInvestment,
                monthlyInvestment,
                yearlyIncrease
            );

            // Sonucu döndür
            return {
                code: fund.code,
                management_company_id: fund.management_company_id,
                title: fund.title,
                summary: analysis.summary,
                periodDetails: includeMonthlyDetails ? analysis.periodDetails : undefined
            };

        } catch (error) {
            console.error('Yatırım analizi yapılırken hata oluştu:', error);
            throw error;
        }
    }
}

export default new InvestmentAnalysisService(); 