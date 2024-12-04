import { Request, Response } from 'express';
import { FundYield, FundManagementCompany, FundHistoricalValue } from '../models';
import { buildFundFilters, buildHistoricalValueFilters } from '../utils/queryBuilder';
import { FundFilters, TypedRequest } from '../types';
import { Op } from 'sequelize';

// Tüm fonları listele
export const listFunds = async (req: TypedRequest<FundFilters>, res: Response): Promise<void> => {
    try {
        const filters = buildFundFilters(req.query);
        const sort = req.query.sort || 'title';
        const order = (req.query.order || 'ASC').toUpperCase() as 'ASC' | 'DESC';
        
        const funds = await FundYield.findAndCountAll({
            ...filters,
            include: [{
                model: FundManagementCompany,
                attributes: ['title', 'logo'],
                as: 'management_company'
            }],
            order: [[sort, order]]
        });

        res.json({
            total: funds.count,
            page: parseInt(req.query.page?.toString() || '1'),
            limit: parseInt(req.query.limit?.toString() || '20'),
            data: funds.rows
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Tek bir fon detayı
export const getFundDetails = async (req: Request<{ code: string }>, res: Response): Promise<void> => {
    try {
        const fund = await FundYield.findByPk(req.params.code, {
            include: [{
                model: FundManagementCompany,
                attributes: ['title', 'logo'],
                as: 'management_company'
            }]
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
export const getFundHistoricalValues = async (req: Request<{ code: string }, any, any, { start_date?: string; end_date?: string; interval?: string; sort?: string; order?: 'ASC' | 'DESC' }>, res: Response): Promise<void> => {
    try {
        const filters = buildHistoricalValueFilters(req.query);
        const sort = req.query.sort || 'date';
        const order = (req.query.order || 'DESC').toUpperCase() as 'ASC' | 'DESC';
        
        console.log('Query parameters:', req.query);
        console.log('Generated filters:', JSON.stringify(filters, null, 2));
        
        const history = await FundHistoricalValue.findAll({
            where: {
                code: req.params.code,
                ...filters.where
            },
            order: [[sort, order]],
            logging: (sql) => console.log('Executed SQL:', sql)
        });

        console.log(`Found ${history.length} records`);
        res.json(history);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};

// Fonun getirilerini karşılaştır
export const compareFunds = async (req: Request<any, any, any, { codes: string }>, res: Response): Promise<void> => {
    try {
        const { codes } = req.query;
        if (!codes) {
            res.status(400).json({ error: 'Karşılaştırılacak fon kodları gerekli' });
            return;
        }

        const fundCodes = codes.split(',');
        const funds = await FundYield.findAll({
            where: {
                code: {
                    [Op.in]: fundCodes
                }
            },
            include: [{
                model: FundManagementCompany,
                attributes: ['title'],
                as: 'management_company'
            }],
            attributes: [
                'code', 'title', 'type',
                'yield_1m', 'yield_3m', 'yield_6m',
                'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'
            ]
        });

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