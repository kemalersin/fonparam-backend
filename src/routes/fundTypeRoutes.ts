import express from 'express';
import { listFundTypes, getFundType } from '../controllers/fundTypeController';
import { validateFundType, validateListFundTypes } from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter, RATE_LIMITS } from '../middleware/rateLimiter';

const router = express.Router();

// Tüm fon tiplerini listele
router.get('/', 
    rateLimiter('fund-types-list', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    validateListFundTypes,
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    listFundTypes
);

// Belirli bir fon tipinin detaylarını getir
router.get('/:type', 
    rateLimiter('fund-type-detail', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    validateFundType, 
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    getFundType
);

export default router; 