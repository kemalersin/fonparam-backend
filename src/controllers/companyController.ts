import { Request, Response } from 'express';
import { FundManagementCompany, Fund, FundYield, FundType } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Şirket verilerini formatla
const formatCompanyResponse = (company: FundManagementCompany) => {
    return {
        code: company.code,
        title: company.title,
        logo: company.logoUrl,
        total_funds: company.total_funds,
        avg_yield_1d: company.avg_yield_1d,
        avg_yield_1w: company.avg_yield_1w,
        avg_yield_1m: company.avg_yield_1m,
        avg_yield_6m: company.avg_yield_6m,
        avg_yield_ytd: company.avg_yield_ytd,
        avg_yield_1y: company.avg_yield_1y,
        avg_yield_3y: company.avg_yield_3y,
        avg_yield_5y: company.avg_yield_5y
    };
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

        // Fon sayısı filtresi
        if (minTotalFunds > 0) {
            where.total_funds = {
                [Op.gte]: minTotalFunds
            };
        }
        if (maxTotalFunds < 999999) {
            where.total_funds = {
                ...where.total_funds,
                [Op.lte]: maxTotalFunds
            };
        }

        // Sıralama alanını belirle
        const orderField = sort.startsWith('avg_yield_') ? sort :
            ['code', 'title', 'total_funds'].includes(sort) ? sort : 'code';

        // Şirketleri getir
        const { count, rows } = await FundManagementCompany.findAndCountAll({
            where,
            attributes: [
                'code',
                'title',
                'logo',
                'total_funds',
                'avg_yield_1d',
                'avg_yield_1w',
                'avg_yield_1m',
                'avg_yield_6m',
                'avg_yield_ytd',
                'avg_yield_1y',
                'avg_yield_3y',
                'avg_yield_5y'
            ],
            order: [[orderField, order]],
            limit,
            offset
        });

        res.json({
            total: count,
            page,
            limit,
            data: rows.map(formatCompanyResponse)
        });
    } catch (error) {
        console.error('Şirket listesi alınırken hata:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};

// Tek bir şirketin detaylarını getir
export const getCompanyDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.params;
        const includeFunds = req.query.include_funds === 'true';
        const timestamp = Date.now(); // Cache'i engellemek için

        // Şirketi bul
        const company = await FundManagementCompany.findByPk(code);
        if (!company) {
            res.status(404).json({ error: 'Şirket bulunamadı' });
            return;
        }

        // Şirketin fonlarını getir
        const funds = includeFunds ? await Fund.findAll({
            where: { management_company_id: code },
            attributes: ['code', 'title', 'tefas'],
            include: [
                {
                    model: FundYield,
                    as: 'yield',
                    attributes: ['yield_1d', 'yield_1w', 'yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y']
                },
                {
                    model: FundType,
                    as: 'fund_type',
                    attributes: ['short_name']
                }
            ],
            order: sequelize.literal(`RAND(${timestamp})`),
            limit: 20,
            raw: true,
            nest: true
        }).then(randomFunds => 
            // Rastgele seçilen fonları kod sırasına göre sırala
            randomFunds.sort((a, b) => a.code.localeCompare(b.code))
        ) : [];

        // En iyi performans gösteren fonları getir
        const bestPerformingFunds = includeFunds ? await Fund.findAll({
            where: { management_company_id: code },
            attributes: ['code', 'title', 'tefas'],
            include: [
                {
                    model: FundYield,
                    as: 'yield',
                    attributes: ['yield_1d', 'yield_1w', 'yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'],
                    where: {
                        yield_1y: { [Op.not]: null }
                    }
                },
                {
                    model: FundType,
                    as: 'fund_type',
                    attributes: ['short_name']
                }
            ],
            order: [[{ model: FundYield, as: 'yield' }, 'yield_1y', 'DESC']],
            limit: 5
        }) : [];

        res.json({
            ...formatCompanyResponse(company),
            funds: funds.map(fund => ({
                code: fund.code,
                title: fund.title,
                tefas: fund.tefas,
                type: fund.fund_type.short_name,
                yield_1d: fund.yield?.yield_1d,
                yield_1w: fund.yield?.yield_1w,
                yield_1m: fund.yield?.yield_1m,
                yield_3m: fund.yield?.yield_3m,
                yield_6m: fund.yield?.yield_6m,
                yield_ytd: fund.yield?.yield_ytd,
                yield_1y: fund.yield?.yield_1y,
                yield_3y: fund.yield?.yield_3y,
                yield_5y: fund.yield?.yield_5y
            })),
            best_performing_funds: bestPerformingFunds.map(fund => ({
                code: fund.code,
                title: fund.title,
                tefas: fund.tefas,
                type: fund.fund_type.short_name,
                yield_1d: fund.yield?.yield_1d,
                yield_1w: fund.yield?.yield_1w,
                yield_1m: fund.yield?.yield_1m,
                yield_3m: fund.yield?.yield_3m,
                yield_6m: fund.yield?.yield_6m,
                yield_ytd: fund.yield?.yield_ytd,
                yield_1y: fund.yield?.yield_1y,
                yield_3y: fund.yield?.yield_3y,
                yield_5y: fund.yield?.yield_5y
            }))
        });
    } catch (error) {
        console.error('Şirket detayı alınırken hata:', error);
        res.status(500).json({ error: (error as Error).message });
    }
}; 