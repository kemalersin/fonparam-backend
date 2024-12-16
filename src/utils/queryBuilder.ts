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
        { '$Fund.title$': { [Op.like]: `%${search}%` } },
        { '$management_company.code$': { [Op.like]: `%${search}%` } },
        { '$management_company.title$': { [Op.like]: `%${search}%` } }
    ]
});

// Ana fonksiyonlar
export const buildFundFilters = (query: FundFilters): BaseFilters => {
    let where: WhereOptions<any> & Record<string, any> = {};
    const { limit, offset } = calculatePagination(query.page, query.limit);

    // Temel filtreler
    const filters: any[] = [];

    if (query.type) {
        filters.push({
            [Op.or]: [
                { '$fund_type.type$': query.type },
                { '$fund_type.short_name$': query.type },
                { '$fund_type.long_name$': query.type },
                { '$fund_type.group_name$': query.type }
            ]
        });
    }

    if (query.management_company) {
        filters.push({ '$management_company.code$': query.management_company });
    }

    if (query.tefas !== undefined) {
        filters.push({ tefas: query.tefas === 'true' });
    }

    if (query.code) {
        const codes = query.code.split(',').map(code => code.trim());
        filters.push({
            code: codes.length === 1 
                ? { [Op.like]: `%${codes[0]}%` }
                : { [Op.in]: codes }
        });
    }

    // Getiri filtreleri
    ['yield_1d', 'yield_1w', 'yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'].forEach(field => {
        if (query[field]) {
            filters.push({ [field]: query[field] });
        }
    });

    // Arama filtresi
    if (query.search) {
        filters.push(buildSearchFilter(query.search));
    }

    // Tüm filtreleri AND ile birleştir
    where = filters.length > 0 ? { [Op.and]: filters } : {};

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