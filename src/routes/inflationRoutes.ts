import { Router } from 'express';
import { inflationController } from '../controllers/inflationController';

const router = Router();

// Tüm enflasyon verilerini listele (ay ve yıl filtresi opsiyonel)
router.get('/', inflationController.list);

// Son enflasyon verisini getir
router.get('/latest', inflationController.getLatest);

// Belirli bir ay ve yıldaki enflasyon verisini getir
router.get('/:year/:month', inflationController.getByDate);

export default router; 