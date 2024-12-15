import { Request, Response } from 'express';
import { DailyStatistics } from '../models';
import { Op } from 'sequelize';

// Günlük istatistikleri listele
export const listStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page?.toString() || '1');
        const limit = parseInt(req.query.limit?.toString() || '20');
        const offset = (page - 1) * limit;
        const sort = req.query.sort?.toString() || 'date';
        const order = (req.query.order?.toString() || 'DESC').toUpperCase() as 'ASC' | 'DESC';
        const startDate = req.query.start_date?.toString();
        const endDate = req.query.end_date?.toString();

        // Tarih filtresi oluştur
        const where: any = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = startDate;
            if (endDate) where.date[Op.lte] = endDate;
        }

        // Verileri getir
        const { count, rows } = await DailyStatistics.findAndCountAll({
            where,
            order: [[sort, order]],
            limit,
            offset
        });

        // Sayısal değerleri dönüştür
        const formattedRows = rows.map(row => ({
            date: row.date,
            total_funds: Number(row.total_funds),
            total_companies: Number(row.total_companies),
            total_investors: Number(row.total_investors),
            total_aum: Number(row.total_aum),
            avg_profit: Number(row.avg_profit),
            avg_loss: Number(row.avg_loss)
        }));

        res.json({
            total: count,
            page,
            limit,
            data: formattedRows
        });
    } catch (error) {
        console.error('İstatistikler listelenirken hata:', error);
        res.status(500).json({ error: 'İstatistikler listelenirken bir hata oluştu' });
    }
};

// Belirli bir günün istatistiklerini getir
export const getStatisticsByDate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date } = req.params;

        const statistics = await DailyStatistics.findByPk(date);
        if (!statistics) {
            res.status(404).json({ error: 'Belirtilen tarih için istatistik bulunamadı' });
            return;
        }

        res.json({
            date: statistics.date,
            total_funds: Number(statistics.total_funds),
            total_companies: Number(statistics.total_companies),
            total_investors: Number(statistics.total_investors),
            total_aum: Number(statistics.total_aum),
            avg_profit: Number(statistics.avg_profit),
            avg_loss: Number(statistics.avg_loss)
        });
    } catch (error) {
        console.error('İstatistik detayı alınırken hata:', error);
        res.status(500).json({ error: 'İstatistik detayı alınırken bir hata oluştu' });
    }
};

// Son istatistikleri getir
export const getLatestStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        const statistics = await DailyStatistics.findOne({
            order: [['date', 'DESC']]
        });

        if (!statistics) {
            res.status(404).json({ error: 'İstatistik bulunamadı' });
            return;
        }

        res.json({
            date: statistics.date,
            total_funds: Number(statistics.total_funds),
            total_companies: Number(statistics.total_companies),
            total_investors: Number(statistics.total_investors),
            total_aum: Number(statistics.total_aum),
            avg_profit: Number(statistics.avg_profit),
            avg_loss: Number(statistics.avg_loss)
        });
    } catch (error) {
        console.error('Son istatistikler alınırken hata:', error);
        res.status(500).json({ error: 'Son istatistikler alınırken bir hata oluştu' });
    }
}; 