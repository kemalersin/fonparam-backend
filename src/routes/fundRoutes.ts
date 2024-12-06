import express from 'express';
import {
    listFunds,
    getFundDetails,
    getFundHistoricalValues,
    compareFunds
} from '../controllers/fundController';
import { analyzeInvestment } from '../controllers/investmentAnalysisController';
import {
    validateFundCode,
    validateDateRange,
    validateComparisonRequest,
    validateAnalysisRequest
} from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter, RATE_LIMITS } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/', 
    rateLimiter('funds-list', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    listFunds
);

router.get(
    '/compare',
    rateLimiter('comparison', RATE_LIMITS.FUND_COMPARE.MAX, RATE_LIMITS.FUND_COMPARE.WINDOW_MINUTES),
    validateComparisonRequest,
    cacheMiddleware(CACHE_DURATIONS.FUND_COMPARE),
    compareFunds
);

router.get('/:code', 
    rateLimiter('fund-detail', RATE_LIMITS.FUND_DETAIL.MAX, RATE_LIMITS.FUND_DETAIL.WINDOW_MINUTES),
    validateFundCode, 
    cacheMiddleware(CACHE_DURATIONS.FUND_DETAIL), 
    getFundDetails
);

router.get(
    '/:code/historical',
    rateLimiter('historical', RATE_LIMITS.FUND_HISTORY.MAX, RATE_LIMITS.FUND_HISTORY.WINDOW_MINUTES),
    validateFundCode,
    validateDateRange,
    cacheMiddleware(CACHE_DURATIONS.FUND_HISTORY),
    getFundHistoricalValues
);

router.get(
    '/:code/analyze',
    validateAnalysisRequest,
    rateLimiter('analyze', RATE_LIMITS.FUND_DETAIL.MAX, RATE_LIMITS.FUND_DETAIL.WINDOW_MINUTES),
    cacheMiddleware(CACHE_DURATIONS.FUND_ANALYSIS),
    analyzeInvestment
);

export default router; 