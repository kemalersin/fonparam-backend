import { Request, Response } from 'express';
import { Op } from 'sequelize';
import ApiLog from '../models/ApiLog';

export const apiLogController = {
    // API loglarını temizle
    async cleanupLogs(req: Request, res: Response) {
        try {
            const { days } = req.query;
            let totalRecords = 0;
            let deletedCount = 0;

            // Admin URL'lerini tanımla
            const adminEndpoints = ['/api-keys', '/api-logs'];
            const adminUrlCondition = {
                [Op.and]: adminEndpoints.map(endpoint => ({
                    endpoint: {
                        [Op.notLike]: `${endpoint}%`
                    }
                }))
            };

            if (days) {
                // Belirtilen günden eski kayıtları sil
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - Number(days));

                // Önce silinecek kayıt sayısını al
                totalRecords = await ApiLog.count({
                    where: {
                        [Op.and]: [
                            {
                                created_at: {
                                    [Op.lt]: cutoffDate
                                }
                            },
                            adminUrlCondition
                        ]
                    }
                });

                // Sonra kayıtları sil
                deletedCount = await ApiLog.destroy({
                    where: {
                        [Op.and]: [
                            {
                                created_at: {
                                    [Op.lt]: cutoffDate
                                }
                            },
                            adminUrlCondition
                        ]
                    }
                });
            } else {
                // Önce toplam kayıt sayısını al (admin URL'leri hariç)
                totalRecords = await ApiLog.count({
                    where: adminUrlCondition
                });

                // Admin URL'leri hariç tüm kayıtları sil
                deletedCount = await ApiLog.destroy({
                    where: adminUrlCondition
                });
            }

            const remainingLogs = await ApiLog.count();

            res.json({
                success: true,
                message: `${deletedCount} log kaydı silindi`,
                details: days 
                    ? `${days} günden eski ${deletedCount} kayıt silindi (toplam: ${totalRecords}, kalan: ${remainingLogs})` 
                    : `${deletedCount} kayıt silindi (toplam: ${totalRecords}, kalan: ${remainingLogs})`
            });
        } catch (error) {
            console.error('Log kayıtları silinirken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Log kayıtları silinirken bir hata oluştu'
            });
        }
    }
}; 