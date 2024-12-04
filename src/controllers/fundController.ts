import { Request, Response } from 'express';
import { FundYield, FundManagementCompany, FundHistoricalValue } from '../models';
import { buildFundFilters, buildHistoricalValueFilters } from '../utils/queryBuilder';
import { FundFilters, TypedRequest } from '../types';
import { Op, FindOptions } from 'sequelize';

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