import { Request, Response } from 'express';
import investmentAnalysisService from '../services/investmentAnalysisService';

export const analyzeInvestment = async (req: Request, res: Response) => {
    try {
        // yearlyIncrease parametrelerini kontrol et
        const yearlyIncreaseType = req.query['yearlyIncrease.type'];
        const yearlyIncreaseValue = req.query['yearlyIncrease.value'];
        
        // yearlyIncrease objesini oluştur
        const yearlyIncrease = yearlyIncreaseType && yearlyIncreaseValue ? {
            type: yearlyIncreaseType as 'percentage' | 'amount',
            value: parseFloat(yearlyIncreaseValue as string)
        } : undefined;

        const params = {
            fundCode: req.params.code,
            startDate: req.query.startDate as any,
            initialInvestment: parseFloat(req.query.initialInvestment as string),
            monthlyInvestment: parseFloat(req.query.monthlyInvestment as string) || 0,
            yearlyIncrease,
            includeMonthlyDetails: req.query.includeMonthlyDetails === 'true'
        };

        const result = await investmentAnalysisService.analyze(params);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Analiz hesaplanırken bir hata oluştu',
            message: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
}; 