import { Request, Response } from 'express';
import { FundType, FundTypeYields } from '../models';
import { FundTypeEnum } from '../types';
import { Op, literal } from 'sequelize';

// Fon tipi verilerini formatlayan yardımcı fonksiyon
const formatFundType = (fundType: FundType & { yields?: FundTypeYields }) => ({
    type: fundType.type,
    short_name: fundType.short_name,
    long_name: fundType.long_name,
    group_name: fundType.group_name,
    yield_1d: fundType.yields?.yield_1d ? Number(fundType.yields.yield_1d) : null,
    yield_1w: fundType.yields?.yield_1w ? Number(fundType.yields.yield_1w) : null,
    yield_1m: fundType.yields?.yield_1m ? Number(fundType.yields.yield_1m) : null,
    yield_3m: fundType.yields?.yield_3m ? Number(fundType.yields.yield_3m) : null,
    yield_6m: fundType.yields?.yield_6m ? Number(fundType.yields.yield_6m) : null,
    yield_ytd: fundType.yields?.yield_ytd ? Number(fundType.yields.yield_ytd) : null,
    yield_1y: fundType.yields?.yield_1y ? Number(fundType.yields.yield_1y) : null,
    yield_3y: fundType.yields?.yield_3y ? Number(fundType.yields.yield_3y) : null,
    yield_5y: fundType.yields?.yield_5y ? Number(fundType.yields.yield_5y) : null,
    total_funds: Number(fundType.yields?.total_funds),
    total_aum: fundType.yields?.total_aum ? Number(fundType.yields.total_aum) : null
});

// Tüm fon tiplerini listele
export const listFundTypes = async (req: Request, res: Response): Promise<void> => {
    try {
        const sort = req.query.sort?.toString() || 'type';
        const order = (req.query.order?.toString() || 'ASC').toUpperCase() as 'ASC' | 'DESC';
        const minTotalFunds = req.query.min_total_funds ? parseInt(req.query.min_total_funds.toString()) : undefined;
        const maxTotalFunds = req.query.max_total_funds ? parseInt(req.query.max_total_funds.toString()) : undefined;

        // Ana sorgu koşullarını oluştur
        const where: any = {};
        if (minTotalFunds || maxTotalFunds) {
            where[Op.and] = [];
            if (minTotalFunds) {
                where[Op.and].push(literal(`(SELECT total_funds FROM fund_type_yields WHERE fund_type_yields.type = FundType.type) >= ${minTotalFunds}`));
            }
            if (maxTotalFunds) {
                where[Op.and].push(literal(`(SELECT total_funds FROM fund_type_yields WHERE fund_type_yields.type = FundType.type) <= ${maxTotalFunds}`));
            }
        }

        const fundTypes = await FundType.findAll({
            where,
            include: [{
                model: FundTypeYields,
                as: 'yields',
                required: false
            }],
            order: [[sort, order]]
        });

        const formattedTypes = fundTypes.map(type => formatFundType(type as FundType & { yields?: FundTypeYields }));
        res.json(formattedTypes);
    } catch (error) {
        console.error('Fon tipleri listelenirken hata:', error);
        res.status(500).json({ error: 'Fon tipleri listelenirken bir hata oluştu' });
    }
};

// Belirli bir fon tipinin detaylarını getir
export const getFundType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type } = req.params;

        // Geçerli fon tipi kontrolü
        if (!Object.values(FundTypeEnum).includes(type as FundTypeEnum)) {
            res.status(400).json({ error: 'Geçersiz fon tipi' });
            return;
        }

        const fundType = await FundType.findOne({
            where: { type },
            include: [{
                model: FundTypeYields,
                as: 'yields',
                required: false
            }]
        });

        if (!fundType) {
            res.status(404).json({ error: 'Belirtilen fon tipi bulunamadı' });
            return;
        }

        res.json(formatFundType(fundType as FundType & { yields?: FundTypeYields }));
    } catch (error) {
        console.error('Fon tipi detayı alınırken hata:', error);
        res.status(500).json({ error: 'Fon tipi detayı alınırken bir hata oluştu' });
    }
};