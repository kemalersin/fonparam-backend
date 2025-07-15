import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { InflationRate } from '../models';

export const inflationController = {
    // Tüm enflasyon verilerini listele
    list: async (req: Request, res: Response) => {
        try {
            const { start_date, end_date } = req.query;
            
            let whereClause: any = {};
            
            // Tarih filtrelerini ekle
            if (start_date || end_date) {
                whereClause.date = {};
                if (start_date) {
                    whereClause.date[Op.gte] = start_date;
                }
                if (end_date) {
                    whereClause.date[Op.lte] = end_date;
                }
            }

            const inflationRates = await InflationRate.findAll({
                where: whereClause,
                order: [['date', 'DESC']]
            });

            res.json(inflationRates);
        } catch (error) {
            console.error('Enflasyon verileri alınırken hata:', error);
            res.status(500).json({ error: 'Enflasyon verileri alınırken bir hata oluştu' });
        }
    },

    // Belirli bir tarihteki enflasyon verisini getir
    getByDate: async (req: Request, res: Response) => {
        try {
            const { month, year } = req.params;

            // Ay ve yıl parametrelerini kontrol et
            if (!month || !year) {
                return res.status(400).json({ error: 'Ay ve yıl parametreleri gerekli' });
            }

            // Verilen ay ve yılın son gününü bul
            const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
            const targetDate = `${year}-${month.padStart(2, '0')}-${lastDayOfMonth}`;

            const inflationRate = await InflationRate.findOne({
                where: {
                    date: targetDate
                }
            });

            if (!inflationRate) {
                return res.status(404).json({ error: 'Belirtilen tarih için enflasyon verisi bulunamadı' });
            }

            res.json(inflationRate);
        } catch (error) {
            console.error('Enflasyon verisi alınırken hata:', error);
            res.status(500).json({ error: 'Enflasyon verisi alınırken bir hata oluştu' });
        }
    },

    // Son enflasyon verisini getir
    getLatest: async (req: Request, res: Response) => {
        try {
            const latestRate = await InflationRate.findOne({
                order: [['date', 'DESC']]
            });

            if (!latestRate) {
                return res.status(404).json({ error: 'Enflasyon verisi bulunamadı' });
            }

            res.json(latestRate);
        } catch (error) {
            console.error('Son enflasyon verisi alınırken hata:', error);
            res.status(500).json({ error: 'Son enflasyon verisi alınırken bir hata oluştu' });
        }
    }
}; 