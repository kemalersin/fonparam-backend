import { Request, Response } from 'express';
import { FundYield, FundManagementCompany, FundHistoricalValue, Fund, FundType } from '../models';
import { buildFundFilters, buildHistoricalValueFilters } from '../utils/queryBuilder';
import { FundFilters, TypedRequest } from '../types';
import { Op, FindOptions, Order, Sequelize } from 'sequelize';
import sequelize from '../config/database';

// Ortak include tanımları
const INCLUDES = {
    MANAGEMENT_COMPANY: {
        model: FundManagementCompany,
        as: 'management_company',
        attributes: ['code', 'title', 'logo'],
        required: true
    },
    FUND_TYPE: {
        model: FundType,
        as: 'fund_type',
        required: true
    },
    YIELD: {
        model: FundYield,
        as: 'yield',
        required: true
    },
    LAST_HISTORICAL_VALUE: {
        model: FundHistoricalValue,
        as: 'last_historical_value',
        attributes: ['date', 'value', 'aum', 'shares_active', 'cumulative_cashflow', 'investor_count'],
        required: false
    }
};

// Ortak sıralama tanımları
const SORT_FIELDS = {
    // Fund temel alanları
    code: ['code'],
    title: ['title'],
    tefas: ['tefas'],

    // FundYield alanları
    yield_1d: [{ model: FundYield, as: 'yield' }, 'yield_1d'],
    yield_1w: [{ model: FundYield, as: 'yield' }, 'yield_1w'],
    yield_1m: [{ model: FundYield, as: 'yield' }, 'yield_1m'],
    yield_3m: [{ model: FundYield, as: 'yield' }, 'yield_3m'],
    yield_6m: [{ model: FundYield, as: 'yield' }, 'yield_6m'],
    yield_ytd: [{ model: FundYield, as: 'yield' }, 'yield_ytd'],
    yield_1y: [{ model: FundYield, as: 'yield' }, 'yield_1y'],
    yield_3y: [{ model: FundYield, as: 'yield' }, 'yield_3y'],
    yield_5y: [{ model: FundYield, as: 'yield' }, 'yield_5y'],

    // FundHistoricalValue alanları
    'last_historical_value.value': [{ model: FundHistoricalValue, as: 'last_historical_value' }, 'value'],
    'last_historical_value.aum': [{ model: FundHistoricalValue, as: 'last_historical_value' }, 'aum'],
    'last_historical_value.shares_active': [{ model: FundHistoricalValue, as: 'last_historical_value' }, 'shares_active'],
    'last_historical_value.cumulative_cashflow': [{ model: FundHistoricalValue, as: 'last_historical_value' }, 'cumulative_cashflow'],
    'last_historical_value.investor_count': [{ model: FundHistoricalValue, as: 'last_historical_value' }, 'investor_count'],

    // FundManagementCompany alanları
    'management_company.code': [{ model: FundManagementCompany, as: 'management_company' }, 'code'],
    'management_company.title': [{ model: FundManagementCompany, as: 'management_company' }, 'title'],

    // FundType alanları
    'fund_type.type': [{ model: FundType, as: 'fund_type' }, 'type'],
    'fund_type.short_name': [{ model: FundType, as: 'fund_type' }, 'short_name'],
    'fund_type.long_name': [{ model: FundType, as: 'fund_type' }, 'long_name'],
    'fund_type.group_name': [{ model: FundType, as: 'fund_type' }, 'group_name']
} as const;

const formatFundResponse = (fund: Fund) => {
    const orgFund = fund.get({ plain: false });
    const lastHistoricalValue = orgFund.last_historical_value;

    return {
        code: orgFund.code,
        title: orgFund.title,
        tefas: orgFund.tefas,
        yield_1d: orgFund.yield?.yield_1d,
        yield_1w: orgFund.yield?.yield_1w,
        yield_1m: orgFund.yield?.yield_1m,
        yield_3m: orgFund.yield?.yield_3m,
        yield_6m: orgFund.yield?.yield_6m,
        yield_ytd: orgFund.yield?.yield_ytd,
        yield_1y: orgFund.yield?.yield_1y,
        yield_3y: orgFund.yield?.yield_3y,
        yield_5y: orgFund.yield?.yield_5y,
        type: orgFund.fund_type.short_name,
        management_company: orgFund.management_company,
        fund_type: orgFund.fund_type,
        last_historical_value: lastHistoricalValue || null
    };
};

const formatPaginatedResponse = (funds: Fund[], total: number, page: number, limit?: number) => {
    const data = funds.map(fund => formatFundResponse(fund));

    return limit ? {
        total,
        page,
        limit,
        data
    } : data;
};

// Tüm fonları listele
export const listFunds = async (req: TypedRequest<FundFilters>, res: Response): Promise<void> => {
    try {
        const filters = buildFundFilters(req.query);
        const sort = req.query.sort || 'code';
        const order = (req.query.order || 'ASC').toUpperCase() as 'ASC' | 'DESC';

        // Sıralama alanını kontrol et
        const sortField = SORT_FIELDS[sort as keyof typeof SORT_FIELDS] || SORT_FIELDS.title;

        const { count, rows } = await Fund.findAndCountAll({
            where: filters.where,
            limit: filters.limit,
            offset: filters.offset,
            attributes: ['code', 'title', 'tefas'],
            include: [
                INCLUDES.MANAGEMENT_COMPANY,
                INCLUDES.FUND_TYPE,
                INCLUDES.YIELD,
                INCLUDES.LAST_HISTORICAL_VALUE
            ],
            order: [[...sortField, order]],
            subQuery: false
        });

        const page = parseInt(req.query.page?.toString() || '1');
        const limit = parseInt(req.query.limit?.toString() || '20');

        res.json(formatPaginatedResponse(rows, count, page, limit));
    } catch (error) {
        console.error('Fonlar listelenirken hata oluştu:', error);
        res.status(500).json({ error: 'Fonlar listelenirken bir hata oluştu' });
    }
};

// Tek fon detayı
export const getFundDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;

        const fund = await Fund.findOne({
            where: { code },
            attributes: ['code', 'title', 'tefas'],
            include: Object.values(INCLUDES),
        });

        if (!fund) {
            res.status(404).json({ error: 'Fon bulunamadı' });
            return;
        }

        res.json(formatFundResponse(fund));
    } catch (error) {
        console.error('Fon detayı alınırken hata oluştu:', error);
        res.status(500).json({ error: 'Fon detayı alınırken bir hata oluştu' });
    }
};

// Fonun geçmiş değerleri
export const getFundHistoricalValues = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;
        const sort = req.query.sort || 'date';
        const order = (req.query.order || 'DESC').toUpperCase() as 'ASC' | 'DESC';

        // Sıralama alanını kontrol et
        const validSortFields = ['date', 'value', 'aum', 'shares_active', 'yield', 'cumulative_cashflow', 'investor_count'];
        if (!validSortFields.includes(sort as string)) {
            res.status(400).json({ error: 'Geçersiz sıralama alanı' });
            return;
        }

        const filters = buildHistoricalValueFilters(req.query);
        const values = await FundHistoricalValue.findAll({
            where: {
                code,
                ...filters.where
            },
            order: [[sort as string, order]],
            raw: true
        });

        // Sayısal değerleri dönüştür
        const transformedValues = values.map(value => ({
            code: value.code,
            date: value.date,
            value: value.value ? Number(value.value) : null,
            aum: value.aum ? Number(value.aum) : null,
            shares_active: value.shares_active ? Number(value.shares_active) : null,
            yield: value.yield ? Number(value.yield) : null,
            cumulative_cashflow: value.cumulative_cashflow ? Number(value.cumulative_cashflow) : null,
            investor_count: value.investor_count
        }));

        res.json(transformedValues);
    } catch (error) {
        console.error('Geçmiş değerler getirilirken hata oluştu:', error);
        res.status(500).json({ error: 'Geçmiş değerler getirilirken bir hata oluştu' });
    }
};

// Fonları karşılaştır
export const compareFunds = async (req: Request, res: Response): Promise<void> => {
    try {
        const fundCodes = req.query.codes?.toString().split(',');

        if (!fundCodes || fundCodes.length < 2 || fundCodes.length > 5) {
            res.status(400).json({ error: 'En az 2, en fazla 5 fon karşılaştırılabilir' });
            return;
        }

        const funds = await Fund.findAll({
            where: { code: { [Op.in]: fundCodes } },
            attributes: ['code', 'title', 'tefas'],
            include: Object.values(INCLUDES),
        });

        if (funds.length !== fundCodes.length) {
            const foundCodes = funds.map(fund => fund.code);
            const missingCodes = fundCodes.filter(code => !foundCodes.includes(code));
            res.status(404).json({ error: 'Bazı fonlar bulunamadı', missing_codes: missingCodes });
            return;
        }

        res.json(formatPaginatedResponse(funds));
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// En iyi performanslı fonları getir
export const getTopPerformingFunds = async (req: Request, res: Response): Promise<Response> => {
    try {
        const timestamp = Date.now();

        // Referans fonlar belirtilmişse, benzer performanslı fonları getir
        if (req.query.funds) {
            const referenceCodes = req.query.funds.toString().split(',');
            const referenceFunds = (await Fund.findAll({
                where: { code: { [Op.in]: referenceCodes } },
                include: [INCLUDES.YIELD]
            })).map(fund => fund.get({ plain: true }));

            if (!referenceFunds.length) {
                return res.status(404).json({ error: 'Referans fonlar bulunamadı' });
            }

            // Referans fonların ortalama getirisini hesapla
            const validFunds = referenceFunds.filter(fund => fund.yield?.yield_1y != null);
            if (!validFunds.length) {
                return res.status(400).json({ error: 'Referans fonların 1 yıllık getirisi bulunamadı' });
            }

            const avgYield = validFunds.reduce((sum, fund) => sum + Number(fund.yield.yield_1y), 0) / validFunds.length;
            const minYield = avgYield - 10;
            const maxYield = avgYield + 10;

            const funds = await Fund.findAll({
                where: {
                    code: { [Op.notIn]: referenceCodes }
                },
                attributes: ['code', 'title', 'tefas'],
                include: [
                    INCLUDES.MANAGEMENT_COMPANY,
                    INCLUDES.FUND_TYPE,
                    {
                        ...INCLUDES.YIELD,
                        where: {
                            yield_1y: {
                                [Op.between]: [minYield, maxYield]
                            }
                        }
                    },
                    INCLUDES.LAST_HISTORICAL_VALUE
                ],
                order: [sequelize.literal(`RAND(${timestamp})`), ['code', 'ASC']],
                limit: 10
            });

            return res.json(formatPaginatedResponse(funds, funds.length, 1, 10));
        }

        // Referans fon belirtilmemişse en iyi performanslı fonlardan rastgele 10 tane getir
        const topFunds = await Fund.findAll({
            attributes: ['code', 'title', 'tefas'],
            include: [
                INCLUDES.MANAGEMENT_COMPANY,
                INCLUDES.FUND_TYPE,
                {
                    ...INCLUDES.YIELD,
                    where: sequelize.literal('yield_1y IS NOT NULL AND yield_1y > 50')
                },
                INCLUDES.LAST_HISTORICAL_VALUE
            ],
            order: [
                sequelize.literal(`RAND(${timestamp})`),
                ['code', 'ASC']
            ],
            limit: 10
        });

        res.json(formatPaginatedResponse(topFunds));
    } catch (error) {
        return res.status(500).json({
            error: 'Fonlar getirilirken bir hata oluştu',
            details: (error as Error).message
        });
    }
}; 