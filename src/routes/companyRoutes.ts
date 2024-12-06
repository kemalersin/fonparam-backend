import express from 'express';
import { listCompanies, getCompanyDetails } from '../controllers/companyController';
import { validateCompanyCode } from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter, RATE_LIMITS } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/', 
    rateLimiter('companies-list', RATE_LIMITS.COMPANIES_LIST.MAX, RATE_LIMITS.COMPANIES_LIST.WINDOW_MINUTES),
    cacheMiddleware(CACHE_DURATIONS.COMPANIES_LIST), 
    listCompanies
);

router.get('/:code', 
    rateLimiter('company-detail', RATE_LIMITS.COMPANY_DETAIL.MAX, RATE_LIMITS.COMPANY_DETAIL.WINDOW_MINUTES),
    validateCompanyCode, 
    cacheMiddleware(CACHE_DURATIONS.COMPANY_DETAIL), 
    getCompanyDetails
);

export default router; 