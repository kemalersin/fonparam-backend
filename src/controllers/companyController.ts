import { Request, Response } from 'express';
import { FundManagementCompany, FundYield } from '../models';
import { Op, Order } from 'sequelize';
import * as sequelize from 'sequelize';

// Ortalama hesaplama yardımcı fonksiyonu
const calculateAverage = (values: number[]): number | null => {
    const validValues = values.filter(v => v != null);
    return validValues.length > 0
        ? validValues.reduce((acc, val) => acc + Number(val), 0) / validValues.length
        : null;
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

        // Temel where koşulu
        const where: any = {};
        if (search) {
            where[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { title: { [Op.like]: `%${search}%` } }
            ];
        }

        // Fon sayısı filtresi için alt sorgu
        const fundCountSubQuery = `(
            SELECT management_company_id 
            FROM (
                SELECT management_company_id, COUNT(*) as fund_count 
                FROM fund_yields 
                GROUP BY management_company_id
                HAVING fund_count >= ${minTotalFunds} AND fund_count <= ${maxTotalFunds}
            ) as filtered_companies
        )`;

        if (minTotalFunds > 0 || maxTotalFunds < 999999) {
            where.code = {
                [Op.in]: sequelize.literal(`${fundCountSubQuery}`)
            };
        }

        // Sıralama ayarlarını belirle
        let orderClause: Order;
        if (sort === 'total_funds') {
            orderClause = [[sequelize.literal('total_funds'), order]];
        } else if (sort === 'code') {
            orderClause = [[sequelize.col('FundManagementCompany.code'), order]];
        } else if (sort === 'title') {
            orderClause = [[sequelize.col('FundManagementCompany.title'), order]];
        } else if (sort.startsWith('avg_yield')) {
            orderClause = [[sequelize.literal(`AVG(funds.${sort})`), order]];
        } else {
            orderClause = [[sequelize.col('FundManagementCompany.code'), 'ASC']];
        }

        // Önce toplam kayıt sayısını al
        const totalCount = await FundManagementCompany.count({
            where,
            distinct: true,
            include: [{
                model: FundYield,
                as: 'funds',
                attributes: [],
                required: false
            }]
        });

        // Şirketleri getir
        const companies = await FundManagementCompany.findAll({
            where,
            attributes: {
                include: [
                    [sequelize.literal('(SELECT COUNT(*) FROM fund_yields WHERE fund_yields.management_company_id = FundManagementCompany.code)'), 'total_funds']
                ]
            },
            include: [{
                model: FundYield,
                as: 'funds',
                attributes: ['yield_1m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'],
                required: false
            }],
            order: orderClause,
            group: ['FundManagementCompany.code', 'FundManagementCompany.title', 'FundManagementCompany.logo'],
            limit,
            offset,
            subQuery: false
        });

        // Her şirket için istatistikleri hesapla
        const data = await Promise.all(companies.map(async (company: any) => {
            const funds = company.funds || [];
            const stats = {
                avg_yield_1m: calculateAverage(funds.map((f: any) => f.yield_1m)),
                avg_yield_6m: calculateAverage(funds.map((f: any) => f.yield_6m)),
                avg_yield_ytd: calculateAverage(funds.map((f: any) => f.yield_ytd)),
                avg_yield_1y: calculateAverage(funds.map((f: any) => f.yield_1y)),
                avg_yield_3y: calculateAverage(funds.map((f: any) => f.yield_3y)),
                avg_yield_5y: calculateAverage(funds.map((f: any) => f.yield_5y))
            };

            return {
                code: company.code,
                title: company.title,
                logo: company.logo,
                total_funds: company.get('total_funds'),
                ...stats
            };
        }));

        res.json({
            total: totalCount,
            page,
            limit,
            data
        });
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
            where: {
                management_company_id: req.params.code
            },
            order: [['yield_1m', 'DESC']]
        });

        // Geçerli getirisi olan fonları filtrele
        const validFunds1m = funds.filter((fund: FundYield) => fund.yield_1m != null);
        const validFunds6m = funds.filter((fund: FundYield) => fund.yield_6m != null);
        const validFundsYtd = funds.filter((fund: FundYield) => fund.yield_ytd != null);
        const validFunds1y = funds.filter((fund: FundYield) => fund.yield_1y != null);
        const validFunds3y = funds.filter((fund: FundYield) => fund.yield_3y != null);
        const validFunds5y = funds.filter((fund: FundYield) => fund.yield_5y != null);

        // İstatistikleri hesapla
        const stats = {
            total_funds: funds.length,
            avg_yield_1m: validFunds1m.length > 0
                ? validFunds1m.reduce((acc: number, fund: FundYield) => acc + Number(fund.yield_1m), 0) / validFunds1m.length
                : null,
            avg_yield_6m: validFunds6m.length > 0
                ? validFunds6m.reduce((acc: number, fund: FundYield) => acc + Number(fund.yield_6m), 0) / validFunds6m.length
                : null,
            avg_yield_ytd: validFundsYtd.length > 0
                ? validFundsYtd.reduce((acc: number, fund: FundYield) => acc + Number(fund.yield_ytd), 0) / validFundsYtd.length
                : null,
            avg_yield_1y: validFunds1y.length > 0
                ? validFunds1y.reduce((acc: number, fund: FundYield) => acc + Number(fund.yield_1y), 0) / validFunds1y.length
                : null,
            avg_yield_3y: validFunds3y.length > 0
                ? validFunds3y.reduce((acc: number, fund: FundYield) => acc + Number(fund.yield_3y), 0) / validFunds3y.length
                : null,
            avg_yield_5y: validFunds5y.length > 0
                ? validFunds5y.reduce((acc: number, fund: FundYield) => acc + Number(fund.yield_5y), 0) / validFunds5y.length
                : null,
            best_performing_funds: validFunds1y
                .sort((a: FundYield, b: FundYield) => Number(b.yield_1y) - Number(a.yield_1y))
                .slice(0, 5)
                .map((fund: FundYield) => ({
                    code: fund.code,
                    title: fund.title,
                    type: fund.type,
                    yield_1m: fund.yield_1m,
                    yield_6m: fund.yield_6m,
                    yield_ytd: fund.yield_ytd,
                    yield_1y: fund.yield_1y,
                    yield_3y: fund.yield_3y,
                    yield_5y: fund.yield_5y
                }))
        };

        res.json({
            company,
            stats,
            funds: includeFunds ? funds : undefined
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}; 