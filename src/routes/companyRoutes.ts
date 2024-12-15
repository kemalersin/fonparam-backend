import express from 'express';
import { listCompanies, getCompanyDetails } from '../controllers/companyController';
import { validateCompanyCode } from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/', 
    rateLimiter,
    cacheMiddleware(CACHE_DURATIONS.COMPANIES_LIST), 
    listCompanies
);

router.get('/:code', 
    rateLimiter,
    validateCompanyCode, 
    //cacheMiddleware(CACHE_DURATIONS.COMPANY_DETAIL), 
    getCompanyDetails
);

export default router; 