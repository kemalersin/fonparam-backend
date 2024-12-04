import { Request, Response } from 'express';
import { FundManagementCompany, FundYield } from '../models';
import { Op, Order } from 'sequelize';
import sequelize from '../config/database';

const getOrderClause = (sort: string, order: 'ASC' | 'DESC'): Order => {
    const orderMap: Record<string, Order> = {
        'total_funds': [[sequelize.fn('COUNT', sequelize.col('funds.code')), order]],
        'code': [[sequelize.col('FundManagementCompany.code'), order]],
        'title': [[sequelize.col('FundManagementCompany.title'), order]]
    };

    if (sort.startsWith('avg_yield_')) {
        const period = sort.replace('avg_yield_', '');
        return [[sequelize.fn('AVG', sequelize.col(`funds.yield_${period}`)), order]];
    }

    return orderMap[sort] || [[sequelize.col('FundManagementCompany.code'), 'ASC']];
};

const calculateStats = (funds: FundYield[]) => {
    const periods = ['1m', '6m', 'ytd', '1y', '3y', '5y'] as const;
    const stats: Record<string, any> = { total_funds: funds.length };

    // Ortalama getirileri hesapla
    periods.forEach(period => {
        const validFunds = funds.filter(fund => fund[`yield_${period}`] !== null && fund[`yield_${period}`] !== undefined);
        if (validFunds.length > 0) {
            const sum = validFunds.reduce((acc, fund) => acc + Number(fund[`yield_${period}`]), 0);
            stats[`avg_yield_${period}`] = Number((sum / validFunds.length).toFixed(2));
        } else {
            stats[`avg_yield_${period}`] = null;
        }
    });

    // En iyi performans gösteren fonları bul
    stats.best_performing_funds = funds
        .filter(fund => fund.yield_1y != null)
        .sort((a, b) => Number(b.yield_1y) - Number(a.yield_1y))
        .slice(0, 5)
        .map(fund => ({
            code: fund.code,
            title: fund.title,
            type: fund.type,
            ...Object.fromEntries(periods.map(period => [`yield_${period}`, fund[`yield_${period}`]]))
        }));

    return stats;
};

// Tüm şirketleri listele
export const listCompanies = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page?.toString() || '1');
        const limit = parseInt(req.query.limit?.toString() || '20');
        const offset = (page - 1) * limit;
        const sort = req.query.sort?.toString() || 'code';
        const order = (req.query.order?.toString() || 'ASC').toUpperCase() as 'ASC' | 'DESC';
        const search = req.query.search?.toString();
        const minTotalFunds = parseInt(req.query.min_total_funds?.toString() || '0');
        const maxTotalFunds = parseInt(req.query.max_total_funds?.toString() || '999999');

        // Where koşulunu oluştur
        const where: any = {};
        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { title: { [Op.like]: `%${search}%` } }
            ];
        }

        // Fon sayısı filtresi için alt sorgu
        const havingClause = minTotalFunds > 0 || maxTotalFunds < 999999
            ? `HAVING COUNT(funds.code) >= ${minTotalFunds} AND COUNT(funds.code) <= ${maxTotalFunds}`
            : '';

        // Toplam kayıt sayısını al
        const countQuery = `
            SELECT COUNT(DISTINCT t.code) as total
            FROM (
                SELECT fmc.code
                FROM fund_management_companies fmc
                LEFT JOIN fund_yields funds ON fmc.code = funds.management_company_id
                ${where[Op.or] ? `WHERE fmc.code LIKE '%${search}%' OR fmc.title LIKE '%${search}%'` : ''}
                GROUP BY fmc.code
                ${havingClause}
            ) t`;

        const [totalResult] = await sequelize.query(countQuery);
        const totalCount = (totalResult as any)[0].total;

        // Şirketleri getir
        const companies = await FundManagementCompany.findAll({
            where,
            attributes: [
                'code',
                'title',
                'logo',
                [sequelize.fn('COUNT', sequelize.col('funds.code')), 'total_funds'],
                [sequelize.fn('AVG', sequelize.col('funds.yield_1m')), 'avg_yield_1m'],
                [sequelize.fn('AVG', sequelize.col('funds.yield_6m')), 'avg_yield_6m'],
                [sequelize.fn('AVG', sequelize.col('funds.yield_ytd')), 'avg_yield_ytd'],
                [sequelize.fn('AVG', sequelize.col('funds.yield_1y')), 'avg_yield_1y'],
                [sequelize.fn('AVG', sequelize.col('funds.yield_3y')), 'avg_yield_3y'],
                [sequelize.fn('AVG', sequelize.col('funds.yield_5y')), 'avg_yield_5y']
            ],
            include: [{
                model: FundYield,
                as: 'funds',
                attributes: [],
                required: false
            }],
            order: getOrderClause(sort, order),
            group: ['FundManagementCompany.code', 'FundManagementCompany.title', 'FundManagementCompany.logo'],
            having: havingClause ? sequelize.literal(havingClause.replace('HAVING ', '')) : undefined,
            limit,
            offset,
            subQuery: false
        });

        // İstatistikleri formatla
        const data = companies.map((company: any) => {
            interface CompanyStats {
                code: string;
                title: string;
                logo: string | null;
                total_funds: number;
                [key: `avg_yield_${string}`]: number | null;
            }

            const result: CompanyStats = {
                code: company.code,
                title: company.title,
                logo: company.logo,
                total_funds: parseInt(company.get('total_funds')),
            };

            // Ortalama getirileri formatla
            ['1m', '6m', 'ytd', '1y', '3y', '5y'].forEach(period => {
                const avg = company.get(`avg_yield_${period}`);
                result[`avg_yield_${period}`] = avg !== null ? Number(Number(avg).toFixed(2)) : null;
            });

            return result;
        });

        res.json({ total: totalCount, page, limit, data });
    } catch (error) {
        console.error('Şirket listesi alınırken hata:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};

// Tek bir şirketin detaylarını getir
export const getCompanyDetails = async (req: Request<{ code: string }>, res: Response): Promise<void> => {
    try {
        const includeFunds = req.query.include_funds !== 'false';
        const company = await FundManagementCompany.findByPk(req.params.code);

        if (!company) {
            res.status(404).json({ error: 'Şirket bulunamadı' });
            return;
        }

        // Şirketin fonlarını getir
        const funds = await FundYield.findAll({
            where: { management_company_id: req.params.code },
            order: [['yield_1m', 'DESC']]
        });

        res.json({
            company,
            stats: calculateStats(funds),
            funds: includeFunds ? funds : undefined
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}; 