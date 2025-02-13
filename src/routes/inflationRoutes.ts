import { Router } from 'express';
import { inflationController } from '../controllers/inflationController';
import { validateDateRange } from '../middleware/validators';

const router = Router();

// Tüm enflasyon verilerini listele
router.get('/', validateDateRange, inflationController.list);

// Son enflasyon verisini getir
router.get('/latest', inflationController.getLatest);

// Belirli bir ay ve yıldaki enflasyon verisini getir
router.get('/:year/:month', inflationController.getByDate);

export default router; 