import { FundHistoricalValue, FundYield } from '../models';
import { InvestmentAnalysisRequest, InvestmentAnalysisResponse, StartDate, MonthlyDetail } from '../interfaces/investmentAnalysis';
import { Op } from 'sequelize';

class InvestmentAnalysisService {
    /**
     * Başlangıç tarihini hesaplar
     */
    private getStartDate(startDate: StartDate): Date {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();
        
        // Başlangıç tarihini hesapla
        let targetDate = new Date(now);
        
        switch (startDate) {
            case '5_years_ago':
                targetDate.setFullYear(currentYear - 5);
                break;
            case '3_years_ago':
                targetDate.setFullYear(currentYear - 3);
                break;
            case '1_year_ago':
                targetDate.setFullYear(currentYear - 1);
                break;
            case 'year_start':
                return new Date(currentYear, 0, 1);
            case '6_months_ago':
                targetDate.setMonth(currentMonth - 6);
                break;
            case '3_months_ago':
                targetDate.setMonth(currentMonth - 2); // 3 ay için başlangıç ayı
                break;
            case '1_month_ago':
                targetDate.setMonth(currentMonth - 1);
                break;
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
        yearlyIncrease: { type: 'percentage' | 'amount'; value: number }
    ): number {
        // İlk ay kontrolü
        if (currentDate.getFullYear() === startDate.getFullYear() && 
            currentDate.getMonth() === startDate.getMonth()) {
            return 0; // İlk ay sadece başlangıç yatırımı var
        }

        // Artış yoksa temel miktar
        if (yearlyIncrease.value === 0) return baseAmount;

        // Yıl farkını hesapla
        const yearsPassed = currentDate.getFullYear() - startDate.getFullYear();
        
        // İlk yılın Ocak ayı kontrolü
        if (yearsPassed === 1 && currentDate.getMonth() === 0 && startDate.getMonth() === 11) {
            return baseAmount; // İlk yılın Ocak ayında artış yok
        }

        if (yearsPassed <= 0) return baseAmount;

        // Artışı hesapla
        if (yearlyIncrease.type === 'percentage') {
            return baseAmount * Math.pow(1 + yearlyIncrease.value / 100, yearsPassed);
        } else {
            return baseAmount + (yearlyIncrease.value * yearsPassed);
        }
    }

    async analyze(request: InvestmentAnalysisRequest): Promise<InvestmentAnalysisResponse> {
        const startDate = this.getStartDate(request.startDate);
        const endDate = new Date();

        // Fon bilgilerini getir
        const fund = await FundYield.findByPk(request.fundCode);
        if (!fund) {
            throw new Error('Fon bulunamadı');
        }

        // Fon verilerini getir
        const fundData = await FundHistoricalValue.findAll({
            attributes: ['code', 'date', 'value'],
            where: {
                code: request.fundCode,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'ASC']]
        });

        if (!fundData.length) {
            throw new Error('Fon için veri bulunamadı');
        }

        // Her ay için fon verilerini düzenle
        const monthlyFundData = new Map<string, FundHistoricalValue>();
        const now = new Date();
        let lastUsedDate = now; // Son kullanılan gerçek tarihi takip etmek için
        
        fundData.forEach(data => {
            const dataDate = new Date(data.date);
            const key = `${dataDate.getFullYear()}-${dataDate.getMonth() + 1}`;
            
            // Her ay için hedef güne en yakın geçmiş tarihteki veriyi al
            if (!monthlyFundData.has(key)) {
                monthlyFundData.set(key, data);
            } else {
                const existingDate = new Date(monthlyFundData.get(key)!.date);
                const targetDay = lastUsedDate.getDate();
                
                // Hedef günden önceki en yakın tarihi bul
                if (dataDate.getDate() <= targetDay && 
                    (existingDate.getDate() > targetDay || dataDate.getDate() > existingDate.getDate())) {
                    monthlyFundData.set(key, data);
                }
            }
        });

        // Hesaplama değişkenleri
        let totalInvestment = request.initialInvestment;
        let totalUnits = 0;
        let previousValue = 0;
        const monthlyDetails: MonthlyDetail[] = [];
        let currentDate = new Date(startDate);

        // Her ay için hesapla
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();
        
        while (currentDate.getFullYear() < endYear || 
              (currentDate.getFullYear() === endYear && currentDate.getMonth() <= endMonth)) {
            const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
            const monthData = monthlyFundData.get(monthKey);

            if (!monthData?.value) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                continue;
            }

            // Gerçek tarihi kullan
            currentDate = new Date(monthData.date);

            // İlk ay mı kontrol et
            const isFirstMonth = monthlyDetails.length === 0;

            // Aylık yatırım miktarını hesapla
            const monthlyInvestment = this.calculateMonthlyInvestment(
                request.monthlyInvestment,
                currentDate,
                startDate,
                request.yearlyIncrease
            );

            // İlk ay için başlangıç yatırımı
            if (isFirstMonth) {
                totalUnits = request.initialInvestment / monthData.value;
            } else if (monthlyInvestment > 0) {
                // Sonraki aylar için aylık yatırım
                totalInvestment += monthlyInvestment;
                const newUnits = monthlyInvestment / monthData.value;
                totalUnits += newUnits;
            }

            // Değerleri hesapla
            const currentValue = totalUnits * monthData.value;
            const investment = isFirstMonth ? 0 : monthlyInvestment;
            const yieldAmount = currentValue - totalInvestment;
            const yieldPercentage = isFirstMonth ? 0 : 
                ((currentValue - (previousValue + monthlyInvestment)) / (previousValue + monthlyInvestment)) * 100;

            // Detayları ekle
            if (request.includeMonthlyDetails) {
                monthlyDetails.push({
                    date: currentDate.toISOString().split('T')[0],
                    investment,
                    totalInvestment,
                    unitPrice: Number(monthData.value),
                    units: isFirstMonth ? totalUnits : monthlyInvestment / monthData.value,
                    totalUnits,
                    value: currentValue,
                    yield: yieldAmount,
                    yieldPercentage
                });
            }

            previousValue = currentValue;
            
            // Sonraki aya geç - son kullanılan gerçek tarihi baz alarak
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // Özet hesapla
        const lastValue = totalUnits * fundData[fundData.length - 1].value!;
        const totalYield = lastValue - totalInvestment;

        return {
            code: fund.code,
            management_company_id: fund.management_company_id,
            title: fund.title,
            summary: {
                totalInvestment,
                currentValue: lastValue,
                totalYield,
                totalYieldPercentage: (totalYield / totalInvestment) * 100
            },
            ...(request.includeMonthlyDetails && { monthlyDetails })
        };
    }
}

export default new InvestmentAnalysisService(); 