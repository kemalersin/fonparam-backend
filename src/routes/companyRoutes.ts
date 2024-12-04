import express from 'express';
import { listCompanies, getCompanyDetails } from '../controllers/companyController';
import { validateCompanyCode } from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter, RATE_LIMITS } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: ['Portföy Yönetim Şirketleri']
 *     summary: 'Tüm portföy yönetim şirketlerini listeler'
 *     description: 'Portföy yönetim şirketlerini ve ortalama getiri istatistiklerini listeler'
 *     responses:
 *       200:
 *         description: 'Başarılı'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyList'
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', 
    rateLimiter('companies-list', RATE_LIMITS.COMPANIES_LIST.MAX, RATE_LIMITS.COMPANIES_LIST.WINDOW_MINUTES),
    cacheMiddleware(CACHE_DURATIONS.COMPANIES_LIST), 
    listCompanies
);

/**
 * @swagger
 * /companies/{code}:
 *   get:
 *     tags: ['Portföy Yönetim Şirketleri']
 *     summary: 'Portföy yönetim şirketi detaylarını getirir'
 *     description: 'Belirtilen portföy yönetim şirketinin detaylarını ve istatistiklerini getirir'
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         description: 'Şirket kodu'
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 'Başarılı'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyDetails'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/:code', 
    rateLimiter('company-detail', RATE_LIMITS.COMPANY_DETAIL.MAX, RATE_LIMITS.COMPANY_DETAIL.WINDOW_MINUTES),
    validateCompanyCode, 
    cacheMiddleware(CACHE_DURATIONS.COMPANY_DETAIL), 
    getCompanyDetails
);

export default router; 