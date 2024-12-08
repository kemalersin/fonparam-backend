export type StartDate = 'last_5_years' | 'last_3_years' | 'last_1_year' | 'year_start' | 'last_6_months' | 'last_3_months' | 'last_1_month';

export type YearlyIncreaseType = 'percentage' | 'amount';

export interface YearlyIncrease {
    type: YearlyIncreaseType;
    value: number;
}

export interface InvestmentAnalysisRequest {
    fundCode: string;
    startDate: StartDate;
    initialInvestment: number;
    monthlyInvestment: number;
    yearlyIncrease?: YearlyIncrease;
    includeMonthlyDetails?: boolean;
}

export interface MonthlyDetail {
    date: string;              // YYYY-MM-DD formatında
    investment: number;        // O ay yapılan yatırım
    totalInvestment: number;   // O ana kadar yapılan toplam yatırım
    unitPrice: number;         // Fon birim fiyatı
    units: number;             // O ay alınan pay adedi
    totalUnits: number;        // Toplam pay adedi
    value: number;             // Yatırımın o ayki değeri
    monthlyChange: number;      // O ayki değişim (tutar)
    monthlyChangePercentage: number;   // O ayki değişim (%)
    totalYield: number;        // O ana kadarki toplam getiri (tutar)
    totalYieldPercentage: number;     // O ana kadarki toplam getiri (%)
}

export interface InvestmentAnalysisSummary {
    totalInvestment: number;      // Toplam yatırılan para
    currentValue: number;         // Güncel değer
    totalYield: number;           // Toplam getiri (tutar)
    totalYieldPercentage: number; // Toplam getiri (%)
}

export interface InvestmentAnalysisResponse {
    code: string;
    management_company_id: string;
    title: string;
    summary: InvestmentAnalysisSummary;
    monthlyDetails?: MonthlyDetail[];
} 