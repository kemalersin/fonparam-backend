import { Op, WhereOptions } from 'sequelize';
import { CompanyFilters, FundFilters } from '../types';
import { FundYield } from '../models';
import sequelize from '../config/database';
import { literal } from 'sequelize';

interface Filters {
    where: Record<string, any>;
    order?: [string, string][];
    limit?: number;
    offset?: number;
}

interface HistoricalFilters {
    where: {
        date?: {
            [Op.gte]?: string;
            [Op.lte]?: string;
        };
    };
}

export const buildFundFilters = (query: FundFilters) => {
    const where: WhereOptions = {};
    const limit = parseInt(query.limit?.toString() || '20');
    const offset = (parseInt(query.page?.toString() || '1') - 1) * limit;

    // Temel filtreler
    if (query.type) {
        where.type = query.type;
    }

    if (query.management_company) {
        where.management_company_id = query.management_company;
    }

    if (query.tefas !== undefined) {
        where.tefas = query.tefas === 'true';
    }

    if (query.code) {
        where.code = {
            [Op.like]: `%${query.code}%`
        };
    }

    // Getiri filtreleri
    const yieldFields = ['yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'];
    yieldFields.forEach(field => {
        const min = query[`min_${field}`];
        const max = query[`max_${field}`];
        if (min || max) {
            where[field] = {};
            if (min) where[field][Op.gte] = parseFloat(min as string);
            if (max) where[field][Op.lte] = parseFloat(max as string);
        }
    });

    // Arama filtresi
    if (query.search) {
        where[Op.or] = [
            { code: { [Op.like]: `%${query.search}%` } },
            { title: { [Op.like]: `%${query.search}%` } }
        ];
    }

    return {
        where,
        limit,
        offset
    };
};

export const buildHistoricalValueFilters = (query: any) => {
    const where: WhereOptions = {};

    // Tarih filtreleri
    if (query.start_date || query.end_date) {
        where.date = {};
        if (query.start_date) {
            where.date[Op.gte] = query.start_date;
        }
        if (query.end_date) {
            where.date[Op.lte] = query.end_date;
        }
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

        where[Op.and as any] = [
            literal(`(code, date) IN (${subQuery})`)
        ];
    }

    return { where };
};

export const buildCompanyFilters = (query: CompanyFilters) => {
    const where: any = {};
    const page = parseInt(query.page?.toString() || '1');
    const limit = parseInt(query.limit?.toString() || '20');
    const offset = (page - 1) * limit;

    // Arama filtresi
    if (query.search) {
        where[Op.or] = [
            { code: { [Op.like]: `%${query.search}%` } },
            { title: { [Op.like]: `%${query.search}%` } }
        ];
    }

    // Sıralama
    let order: any[] = [['title', 'ASC']];
    if (query.sort) {
        order = [[query.sort, query.order || 'ASC']];
    }

    return {
        where,
        order,
        limit,
        offset,
        include: [{
            model: FundYield,
            attributes: ['yield_1m', 'yield_1y'],
            required: false
        }],
        group: ['FundManagementCompany.code'],
        having: sequelize.literal(buildCompanyHavingClause(query))
    };
};

const buildCompanyHavingClause = (query: CompanyFilters): string => {
    const conditions: string[] = [];

    if (query.min_total_funds) {
        conditions.push(`COUNT(FundYield.code) >= ${query.min_total_funds}`);
    }
    if (query.max_total_funds) {
        conditions.push(`COUNT(FundYield.code) <= ${query.max_total_funds}`);
    }
    if (query.min_avg_yield_1m) {
        conditions.push(`AVG(FundYield.yield_1m) >= ${query.min_avg_yield_1m}`);
    }
    if (query.max_avg_yield_1m) {
        conditions.push(`AVG(FundYield.yield_1m) <= ${query.max_avg_yield_1m}`);
    }
    if (query.min_avg_yield_1y) {
        conditions.push(`AVG(FundYield.yield_1y) >= ${query.min_avg_yield_1y}`);
    }
    if (query.max_avg_yield_1y) {
        conditions.push(`AVG(FundYield.yield_1y) <= ${query.max_avg_yield_1y}`);
    }

    return conditions.length ? conditions.join(' AND ') : '1=1';
}; 