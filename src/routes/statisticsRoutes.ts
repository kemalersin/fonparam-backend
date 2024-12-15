import express from 'express';
import { listStatistics, getStatisticsByDate, getLatestStatistics } from '../controllers/statisticsController';
import { validateDateParam, validateStatisticsList } from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter, RATE_LIMITS } from '../middleware/rateLimiter';

const router = express.Router();

// Tüm istatistikleri listele
router.get('/', 
    rateLimiter('statistics-list', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    validateStatisticsList,
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    listStatistics
);

// Son istatistikleri getir
router.get('/latest', 
    rateLimiter('statistics-latest', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    getLatestStatistics
);

// Belirli bir günün istatistiklerini getir
router.get('/:date', 
    rateLimiter('statistics-detail', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    validateDateParam, 
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    getStatisticsByDate
);

export default router; 