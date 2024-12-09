import { Request, Response } from 'express';
import { FundYield, FundManagementCompany, FundHistoricalValue } from '../models';
import { buildFundFilters, buildHistoricalValueFilters } from '../utils/queryBuilder';
import { FundFilters, TypedRequest } from '../types';
import { Op, FindOptions } from 'sequelize';
import sequelize from '../config/database';

// Ortak include tanımları
const FUND_INCLUDES = {
    MANAGEMENT_COMPANY: {
        model: FundManagementCompany,
        attributes: ['code', 'title', 'logo'],
        as: 'management_company'
    }
};

// Ortak attribute tanımları
const FUND_ATTRIBUTES = {
    COMPARISON: [
        'code', 'title', 'type',
        'yield_1m', 'yield_3m', 'yield_6m',
        'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'
    ]
};

// Tüm fonları listele
export const listFunds = async (req: TypedRequest<FundFilters>, res: Response): Promise<void> => {
    try {
        const filters = buildFundFilters(req.query);
        const sort = req.query.sort || 'title';
        const order = (req.query.order || 'ASC').toUpperCase() as 'ASC' | 'DESC';
        
        const { count, rows } = await FundYield.findAndCountAll({
            ...filters,
            include: [FUND_INCLUDES.MANAGEMENT_COMPANY],
            order: [[sort, order]]
        });

        res.json({
            total: count,
            page: parseInt(req.query.page?.toString() || '1'),
            limit: parseInt(req.query.limit?.toString() || '20'),
            data: rows
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Tek bir fon detayı
export const getFundDetails = async (req: Request<{ code: string }>, res: Response): Promise<void> => {
    try {
        const fund = await FundYield.findByPk(req.params.code, {
            include: [FUND_INCLUDES.MANAGEMENT_COMPANY]
        });

        if (!fund) {
            res.status(404).json({ error: 'Fon bulunamadı' });
            return;
        }

        res.json(fund);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Fonun geçmiş değerleri
export const getFundHistoricalValues = async (
    req: Request<{ code: string }, any, any, { 
        start_date?: string; 
        end_date?: string; 
        interval?: string; 
        sort?: string; 
        order?: 'ASC' | 'DESC' 
    }>, 
    res: Response
): Promise<void> => {
    try {
        const filters = buildHistoricalValueFilters(req.query);
        const sort = req.query.sort || 'date';
        const order = (req.query.order || 'DESC').toUpperCase() as 'ASC' | 'DESC';
        
        const history = await FundHistoricalValue.findAll({
            where: {
                code: req.params.code,
                ...filters.where
            },
            order: [[sort, order]]
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Fonun getirilerini karşılaştır
export const compareFunds = async (
    req: Request<any, any, any, { codes: string }>, 
    res: Response
): Promise<void> => {
    try {
        const { codes } = req.query;
        if (!codes) {
            res.status(400).json({ error: 'Karşılaştırılacak fon kodları gerekli' });
            return;
        }

        const fundCodes = codes.split(',');
        const queryOptions: FindOptions = {
            where: { code: { [Op.in]: fundCodes } },
            include: [FUND_INCLUDES.MANAGEMENT_COMPANY],
            attributes: FUND_ATTRIBUTES.COMPARISON
        };

        const funds = await FundYield.findAll(queryOptions);

        if (funds.length === 0) {
            res.status(404).json({ error: 'Belirtilen fonlar bulunamadı' });
            return;
        }

        if (funds.length !== fundCodes.length) {
            const foundCodes = funds.map(f => f.code);
            const missingCodes = fundCodes.filter(code => !foundCodes.includes(code));
            res.status(404).json({ 
                error: 'Bazı fonlar bulunamadı',
                missing_codes: missingCodes
            });
            return;
        }

        res.json(funds);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getTopPerformingFunds = async (req: Request, res: Response) => {
    try {
        const { funds: fundCodes } = req.query;

        if (fundCodes) {
            // Referans fonların performansına yakın fonları getir
            const referenceFundCodes = Array.isArray(fundCodes) 
                ? fundCodes.map(code => String(code))
                : String(fundCodes).split(',');
            const referenceFunds = await FundYield.findAll({
                where: {
                    code: { [Op.in]: referenceFundCodes },
                    yield_1y: {
                        [Op.ne]: null
                    }
                },
                include: [FUND_INCLUDES.MANAGEMENT_COMPANY]
            });

            if (!referenceFunds.length) {
                return res.status(404).json({ error: 'Belirtilen referans fonlar bulunamadı' });
            }

            // Referans fonların ortalama performansını hesapla
            const validFunds = referenceFunds.filter(fund => fund.yield_1y != null);
            if (!validFunds.length) {
                return res.status(404).json({ error: 'Referans fonların 1 yıllık getiri verisi bulunamadı' });
            }
            
            const avgYield = validFunds.reduce((sum, fund) => sum + Number(fund.yield_1y), 0) / validFunds.length;
            
            if (isNaN(avgYield)) {
                return res.status(500).json({ error: 'Ortalama getiri hesaplanamadı' });
            }

            const yieldRange = 5;
            const minYield = avgYield - yieldRange;
            const maxYield = avgYield + yieldRange;
            const timestamp = Date.now();

            const funds = await FundYield.findAll({
                where: {
                    [Op.and]: [
                        { yield_1y: { [Op.ne]: null } },
                        { yield_1y: { [Op.gt]: 0 } },
                        { yield_1y: { [Op.between]: [minYield, maxYield] } },
                        { code: { [Op.notIn]: referenceFundCodes } }
                    ]
                },
                include: [{
                    model: FundManagementCompany,
                    as: 'management_company',
                    required: true
                }],
                order: [
                    sequelize.literal(`RAND(${timestamp})`),
                    ['yield_1y', 'DESC']
                ],
                limit: 10
            });

            if (!funds.length) {
                return res.status(404).json({ error: 'Benzer performansta fon bulunamadı' });
            }

            return res.json(funds);
        }

        // Referans fon belirtilmemişse en iyi performanslı fonlardan rastgele 10 tane getir
        const timestamp = Date.now(); // Her sorguda farklı bir değer
        const topFunds = await FundYield.findAll({
            where: sequelize.literal('yield_1y IS NOT NULL AND yield_1y > 50'),
            include: [{
                model: FundManagementCompany,
                as: 'management_company',
                required: true
            }],
            order: [
                sequelize.literal(`RAND(${timestamp})`),
                ['yield_1y', 'DESC']
            ],
            limit: 10
        });

        if (!topFunds.length) {
            return res.status(404).json({ error: 'Yüksek performanslı fon bulunamadı' });
        }

        res.json(topFunds);
    } catch (error) {
        res.status(500).json({
            error: 'Fonlar getirilirken bir hata oluştu',
            message: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
}; 