import { Op, WhereOptions, literal } from 'sequelize';
import { CompanyFilters, FundFilters } from '../types';

// Tip tanımlamaları
interface BaseFilters {
    where: Record<string, any>;
    limit?: number;
    offset?: number;
}

interface HistoricalFilters extends BaseFilters {
    where: {
        date?: {
            [Op.gte]?: string;
            [Op.lte]?: string;
        };
        [Op.and]?: any[];
    };
}

// Yardımcı fonksiyonlar
const calculatePagination = (page?: string, limit?: string) => {
    const perPage = parseInt(limit?.toString() || '20');
    const offset = (parseInt(page?.toString() || '1') - 1) * perPage;
    return { limit: perPage, offset };
};

const buildSearchFilter = (search: string) => ({
    [Op.or]: [
        { code: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } }
    ]
});

const buildYieldFilter = (field: string, min?: string, max?: string) => {
    if (!min && !max) return null;

    const filter: Record<symbol, number> = {};
    if (min) filter[Op.gte] = parseFloat(min);
    if (max) filter[Op.lte] = parseFloat(max);
    return filter;
};

// Ana fonksiyonlar
export const buildFundFilters = (query: FundFilters): BaseFilters => {
    let where: WhereOptions<any> & Record<string, any> = {};
    const { limit, offset } = calculatePagination(query.page, query.limit);

    // Temel filtreler
    if (query.type) where.type = query.type;
    if (query.management_company) where.management_company_id = query.management_company;
    if (query.tefas !== undefined) where.tefas = query.tefas === 'true';
    if (query.code) where.code = { [Op.like]: `%${query.code}%` };

    // Getiri filtreleri
    ['yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'].forEach(field => {
        const filter = buildYieldFilter(field, query[`min_${field}`] as string, query[`max_${field}`] as string);
        if (filter) where[field] = filter;
    });

    // Arama filtresi
    if (query.search) {
        where = { ...where, ...buildSearchFilter(query.search) };
    }

    return { where, limit, offset };
};

export const buildHistoricalValueFilters = (query: { start_date?: string; end_date?: string; interval?: string }): HistoricalFilters => {
    const where: HistoricalFilters['where'] = {};

    // Tarih filtreleri
    if (query.start_date || query.end_date) {
        where.date = {};
        if (query.start_date) where.date[Op.gte] = query.start_date;
        if (query.end_date) where.date[Op.lte] = query.end_date;
    }

    // Interval filtresi
    if (query.interval && query.interval !== 'daily') {
        const subQuery = query.interval === 'weekly'
            ? `
                SELECT code, MAX(date) as max_date
                FROM fund_historical_values
                GROUP BY code, YEARWEEK(date, 1)
            `
            : `
                SELECT code, MAX(date) as max_date
                FROM fund_historical_values
                GROUP BY code, DATE_FORMAT(date, '%Y-%m')
            `;

        where[Op.and] = [
            literal(`(code, date) IN (${subQuery})`)
        ];
    }

    return { where };
}; 