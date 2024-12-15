import express from 'express';
import {
    listFunds,
    getFundDetails,
    getFundHistoricalValues,
    compareFunds,
    getTopPerformingFunds
} from '../controllers/fundController';
import { analyzeInvestment } from '../controllers/investmentAnalysisController';
import {
    validateFundCode,
    validateDateRange,
    validateComparisonRequest,
    validateAnalysisRequest
} from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/', 
    rateLimiter,
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    listFunds
);

router.get('/top-performing',
    rateLimiter,
    getTopPerformingFunds
);

router.get(
    '/compare',
    rateLimiter,
    validateComparisonRequest,
    cacheMiddleware(CACHE_DURATIONS.FUND_COMPARE),
    compareFunds
);

router.get('/:code', 
    rateLimiter,
    validateFundCode, 
    cacheMiddleware(CACHE_DURATIONS.FUND_DETAIL), 
    getFundDetails
);

router.get(
    '/:code/historical',
    rateLimiter,
    validateFundCode,
    validateDateRange,
    cacheMiddleware(CACHE_DURATIONS.FUND_HISTORY),
    getFundHistoricalValues
);

router.get(
    '/:code/analyze',
    validateAnalysisRequest,
    rateLimiter,
    cacheMiddleware(CACHE_DURATIONS.FUND_ANALYSIS),
    analyzeInvestment
);

export default router; 