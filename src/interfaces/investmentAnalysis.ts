export type StartDate = '5_years_ago' | '3_years_ago' | '1_year_ago' | 'year_start' | '6_months_ago' | '3_months_ago' | '1_month_ago';

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
    yearlyIncrease: YearlyIncrease;
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
    yield: number;             // O ayki getiri (tutar)
    yieldPercentage: number;   // O ayki getiri (%)
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