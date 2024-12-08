import { FundHistoricalValue, FundYield } from '../models';
import { InvestmentAnalysisRequest, InvestmentAnalysisResponse, StartDate, MonthlyDetail, YearlyIncrease } from '../interfaces/investmentAnalysis';
import { Op } from 'sequelize';

class InvestmentAnalysisService {
    /**
     * Başlangıç tarihini hesaplar
     * @param startDate Başlangıç tarihi tipi
     * @param endDate Bitiş tarihi
     */
    private getStartDate(startDate: StartDate, endDate: Date): Date {
        // Başlangıç tarihini hesapla
        let targetDate = new Date(endDate);
        targetDate.setDate(1); // Ayın ilk gününe ayarla
        
        switch (startDate) {
            case 'last_5_years':
                targetDate.setFullYear(targetDate.getFullYear() - 5);
                break;
            case 'last_3_years':
                targetDate.setFullYear(targetDate.getFullYear() - 3);
                break;
            case 'last_1_year':
                targetDate.setFullYear(targetDate.getFullYear() - 1);
                break;
            case 'year_start':
                return new Date(targetDate.getFullYear(), 0, 1);
            case 'last_6_months':
                targetDate.setMonth(targetDate.getMonth() - 5);
                break;
            case 'last_3_months':
                targetDate.setMonth(targetDate.getMonth() - 2);
                break;
            case 'last_1_month':
                targetDate.setMonth(targetDate.getMonth() - 1);
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

        // Yıl farkını hesapla (tam yılları hesapla)
        const startYear = startDate.getFullYear();
        const currentYear = currentDate.getFullYear();
        const startMonth = startDate.getMonth();
        const currentMonth = currentDate.getMonth();
        
        let yearsPassed = currentYear - startYear;
        
        // Ay kontrolü yaparak kısmi yılları düzelt
        if (currentMonth < startMonth) {
            yearsPassed--;
        }

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

    async analyze(request: InvestmentAnalysisRequest): Promise<InvestmentAnalysisResponse> {
        // Önce en son tarihi bul
        const latestData = await FundHistoricalValue.findOne({
            where: { code: request.fundCode },
            order: [['date', 'DESC']],
            raw: true
        });

        if (!latestData) {
            throw new Error('Fon için veri bulunamadı');
        }

        const endDate = new Date(latestData.date);
        const startDate = this.getStartDate(request.startDate, endDate);

        // Fon bilgilerini getir
        const fund = await FundYield.findByPk(request.fundCode);
        if (!fund) {
            throw new Error('Fon bulunamadı');
        }

        // Başlangıç tarihinden önceki en son veriyi getir
        const previousData = await FundHistoricalValue.findAll({
            attributes: ['code', 'date', 'value'],
            where: {
                code: request.fundCode,
                date: {
                    [Op.lt]: startDate
                }
            },
            order: [['date', 'DESC']],
            limit: 1,
            raw: true
        });

        // Belirtilen tarih aralığındaki verileri getir
        const periodData = await FundHistoricalValue.findAll({
            attributes: ['code', 'date', 'value'],
            where: {
                code: request.fundCode,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'ASC']],
            raw: true
        });

        // Tüm verileri birleştir ve sırala
        const allData = [...previousData, ...periodData].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (!allData.length) {
            throw new Error('Fon için veri bulunamadı');
        }

        // Her ay için fon verilerini düzenle
        const monthlyFundData = new Map<string, FundHistoricalValue>();
        let lastUsedDate = endDate;
        
        allData.forEach(data => {
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
            const dataDate = new Date(monthData.date);
            
            // Eğer veri tarihi başlangıç tarihinden önceyse veya bitiş tarihinden sonraysa atla
            if (dataDate < startDate || dataDate > endDate) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                continue;
            }

            currentDate = dataDate;

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
                totalInvestment = request.initialInvestment; // Başlangıç yatırımını ekle
            } else {
                // Sonraki aylar için aylık yatırım
                const currentMonthInvestment = monthlyInvestment; // Artışlı miktar
                totalInvestment += currentMonthInvestment;
                const newUnits = currentMonthInvestment / monthData.value;
                totalUnits += newUnits;
            }

            // Değerleri hesapla
            const currentValue = totalUnits * monthData.value;
            const investment = isFirstMonth ? request.initialInvestment : monthlyInvestment;

            // O ayki değer değişimini hesapla
            let monthlyChange, monthlyChangePercentage;
            
            if (isFirstMonth) {
                monthlyChange = 0;
                monthlyChangePercentage = 0;
            } else {
                // Basit değişim hesaplaması
                monthlyChange = currentValue - previousValue;
                monthlyChangePercentage = ((currentValue - previousValue) / previousValue) * 100;
            }

            // Toplam getiri hesapla
            const totalYield = currentValue - totalInvestment;
            const totalYieldPercentage = (totalYield / totalInvestment) * 100;

            // Detayları ekle
            if (request.includeMonthlyDetails) {
                monthlyDetails.push({
                    date: currentDate.toISOString().split('T')[0],
                    investment: isFirstMonth ? request.initialInvestment : monthlyInvestment,
                    totalInvestment,
                    unitPrice: Number(monthData.value),
                    units: isFirstMonth ? totalUnits : monthlyInvestment / monthData.value,
                    totalUnits,
                    value: currentValue,
                    monthlyChange: monthlyChange,
                    monthlyChangePercentage: monthlyChangePercentage,
                    totalYield: totalYield,
                    totalYieldPercentage: totalYieldPercentage
                });
            }

            previousValue = currentValue;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // Özet hesapla
        const lastValue = totalUnits * allData[allData.length - 1].value!;
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