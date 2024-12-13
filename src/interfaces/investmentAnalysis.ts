export enum StartDate {
    last_1_day = 'last_1_day',
    last_1_week = 'last_1_week',
    last_1_month = 'last_1_month',
    last_3_months = 'last_3_months',
    last_6_months = 'last_6_months',
    last_1_year = 'last_1_year',
    last_3_years = 'last_3_years',
    last_5_years = 'last_5_years',
    year_start = 'year_start'
}

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

export interface PeriodDetail {
    date: string;              // YYYY-MM-DD formatında
    investment: number;        // O dönemde yapılan yatırım
    totalInvestment: number;   // O ana kadar yapılan toplam yatırım
    unitPrice: number;         // Fon birim fiyatı
    units: number;             // O dönemde alınan pay adedi
    totalUnits: number;        // Toplam pay adedi
    value: number;             // Yatırımın o dönemdeki değeri
    periodChange: number;      // O dönemdeki değişim (tutar)
    periodChangePercentage: number;   // O dönemdeki değişim (%)
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
    periodDetails?: PeriodDetail[];
} 