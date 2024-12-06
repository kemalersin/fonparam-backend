import { Request, Response } from 'express';
import investmentAnalysisService from '../services/investmentAnalysisService';

export const analyzeInvestment = async (req: Request, res: Response) => {
    try {
        const result = await investmentAnalysisService.analyze({
            fundCode: req.params.code,
            startDate: req.query.startDate as any,
            initialInvestment: parseFloat(req.query.initialInvestment as string),
            monthlyInvestment: parseFloat(req.query.monthlyInvestment as string),
            yearlyIncrease: {
                type: req.query['yearlyIncrease.type'] as 'percentage' | 'amount',
                value: parseFloat(req.query['yearlyIncrease.value'] as string)
            },
            includeMonthlyDetails: req.query.includeMonthlyDetails === 'true'
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Analiz hesaplanırken bir hata oluştu',
            message: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
}; 