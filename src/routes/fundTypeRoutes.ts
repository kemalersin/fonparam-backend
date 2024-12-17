import express from 'express';
import { listFundTypes, getFundType } from '../controllers/fundTypeController';
import { validateFundType, validateListFundTypes } from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Tüm fon tiplerini listele
router.get('/', 
    rateLimiter,
    validateListFundTypes,
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    listFundTypes
);

// Belirli bir fon tipinin detaylarını getir
router.get('/:type', 
    rateLimiter,
    validateFundType, 
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    getFundType
);

export default router; 