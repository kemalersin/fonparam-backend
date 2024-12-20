import { FundHistoricalValue, FundYield, Fund, InflationRate } from '../models';
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
                return new Date(targetDate.getFullYear(), 0, 2); // 2 Ocak'ı ayarla
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
        periodType: 'daily' | 'monthly',
        startDateType: StartDate
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
            const records = await FundHistoricalValue.findAll({
                where: {
                    code,
                    date: {
                        [Op.gte]: firstRecord.date,
                        [Op.lte]: endDate
                    }
                },
                order: [['date', 'ASC']]
            });

            // Bugünün verisi yoksa ve son kayıt varsa, son kaydı bugünün tarihiyle ekle
            if (records.length > 0) {
                const lastRecord = records[records.length - 1];
                const lastRecordDate = new Date(lastRecord.date);
                const today = new Date();
                
                // Tarihleri yerel saat dilimine göre ayarla
                lastRecordDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                if (lastRecordDate.getTime() < today.getTime()) {
                    // Bugünün tarihini YYYY-MM-DD formatında al
                    const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');

                    const todayRecord = {
                        ...lastRecord.get({ plain: true }),
                        date: todayStr
                    };
                    records.push(todayRecord as FundHistoricalValue);
                }
            }

            return records;
        }

        // Aylık veri için her ayın hedef güne en yakın verisini al
        const targetDay = startDate.getDate(); // Hedef gün
        const isYearStart = startDateType === StartDate.year_start;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const subQuery = `
            WITH monthly_data AS (
                SELECT 
                    code,
                    date,
                    DATE_FORMAT(date, '%Y-%m') as month_group,
                    CASE 
                        WHEN DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(:endDate, '%Y-%m') THEN 
                            ABS(DATEDIFF(date, :endDate))
                        ELSE 
                            CASE 
                                WHEN :isYearStart = 1 THEN 
                                    ABS(DAY(date) - 2)
                                ELSE 
                                    ABS(DAY(date) - :targetDay)
                            END
                    END as day_diff,
                    ROW_NUMBER() OVER (
                        PARTITION BY code, DATE_FORMAT(date, '%Y-%m') 
                        ORDER BY 
                            CASE 
                                WHEN DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(:endDate, '%Y-%m') THEN 
                                    ABS(DATEDIFF(date, :endDate))
                                ELSE 
                                    CASE 
                                        WHEN :isYearStart = 1 THEN 
                                            ABS(DAY(date) - 2)
                                        ELSE 
                                            ABS(DAY(date) - :targetDay)
                                    END
                            END ASC,
                            date ASC
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
                targetDay,
                isYearStart: isYearStart ? 1 : 0
            }
        });
    };

    /**
     * Belirli bir tarih aralığı için enflasyon verilerini getirir
     */
    private async getInflationData(startDate: Date, endDate: Date): Promise<Map<string, number>> {
        const inflationRates = await InflationRate.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'ASC']]
        });

        // YYYY-MM formatında key'e sahip Map oluştur
        const monthlyRates = new Map<string, number>();
        let lastKnownRate = 0;

        inflationRates.forEach(rate => {
            const date = new Date(rate.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyRates.set(key, rate.monthly_rate);
            lastKnownRate = rate.monthly_rate;
        });

        // Eksik aylar için son bilinen enflasyon oranını kullan
        const currentDate = new Date(endDate);
        const startMonth = new Date(startDate);
        
        while (startMonth <= currentDate) {
            const key = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyRates.has(key)) {
                monthlyRates.set(key, lastKnownRate);
            }
            startMonth.setMonth(startMonth.getMonth() + 1);
        }

        return monthlyRates;
    }

    /**
     * Nominal getiriyi reel getiriye çevirir
     */
    private calculateRealReturn(nominal: number, inflationRate: number): number {
        // Reel getiri = ((1 + nominal) / (1 + enflasyon)) - 1
        return ((1 + (nominal / 100)) / (1 + (inflationRate / 100)) - 1) * 100;
    }

    /**
     * Nominal tutarı reel tutara çevirir
     */
    private calculateRealValue(nominal: number, inflationRate: number): number {
        return nominal / (1 + (inflationRate / 100));
    }

    /**
     * Kümülatif enflasyonu hesaplar
     */
    private calculateCumulativeInflation(
        inflationRates: Map<string, number>,
        currentMonth: string
    ): number {
        let cumulativeInflation = 0;
        for (const [month, rate] of inflationRates.entries()) {
            if (month <= currentMonth) {
                cumulativeInflation = (1 + cumulativeInflation/100) * (1 + rate/100) * 100 - 100;
            }
        }
        return cumulativeInflation;
    }

    // Analiz hesapla
    calculateAnalysis = async (
        historicalData: FundHistoricalValue[],
        periodType: 'daily' | 'monthly',
        initialInvestment: number,
        monthlyInvestment: number,
        startDateValue: Date,
        yearlyIncrease?: YearlyIncrease
    ): Promise<{
        summary: InvestmentAnalysisSummary;
        periodDetails: PeriodDetail[];
    }> => {
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

        // Enflasyon verilerini al
        const endDate = new Date();
        const inflationRates = await this.getInflationData(startDateValue, endDate);

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

            // Nominal değerleri hesapla
            const currentValue = totalUnits * current.value;
            const periodChange = prev ? currentValue - (totalUnits * prev.value) : 0;
            const periodChangePercentage = prev ? ((current.value - prev.value) / prev.value) * 100 : 0;
            const totalYield = currentValue - totalInvestment;
            const totalYieldPercentage = (totalYield / totalInvestment) * 100;

            // Enflasyon hesaplamaları
            const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const monthlyInflation = inflationRates.get(currentMonth) || 0;
            const cumulativeInflation = this.calculateCumulativeInflation(inflationRates, currentMonth);

            // Reel değerleri hesapla
            const realPeriodChange = prev ? (
                periodChange > 0 
                    ? periodChange / (1 + monthlyInflation/100)  // Pozitif getiri: Enflasyon kazancı azaltır
                    : periodChange * (1 + monthlyInflation/100)  // Negatif getiri: Enflasyon kaybı artırır
            ) : 0;
            const realPeriodChangePercentage = prev ? this.calculateRealReturn(periodChangePercentage, monthlyInflation) : 0;
            const realCurrentValue = this.calculateRealValue(currentValue, cumulativeInflation);
            const realTotalYield = prev ? realCurrentValue - totalInvestment : 0;
            const realTotalYieldPercentage = prev ? (realTotalYield / totalInvestment) * 100 : 0;

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
                totalYieldPercentage,
                monthlyInflation,
                cumulativeInflation,
                realPeriodChange,
                realPeriodChangePercentage,
                realTotalYield,
                realTotalYieldPercentage
            });
        }

        // Son değerleri al
        const lastDetail = periodDetails[periodDetails.length - 1];

        return {
            summary: {
                totalInvestment,
                currentValue: lastDetail.value,
                totalYield: lastDetail.totalYield,
                totalYieldPercentage: lastDetail.totalYieldPercentage,
                cumulativeInflation: lastDetail.cumulativeInflation,
                realTotalYield: lastDetail.realTotalYield,
                realTotalYieldPercentage: lastDetail.realTotalYieldPercentage
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
            const historicalData = await this.getHistoricalData(fundCode, startDateValue, periodType, startDate);

            // Analizi hesapla
            const analysis = await this.calculateAnalysis(
                historicalData,
                periodType,
                initialInvestment,
                monthlyInvestment,
                startDateValue,
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