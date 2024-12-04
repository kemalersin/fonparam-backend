import express from 'express';
import {
    listFunds,
    getFundDetails,
    getFundHistoricalValues,
    compareFunds
} from '../controllers/fundController';
import {
    validateFundCode,
    validateDateRange,
    validateComparisonRequest
} from '../middleware/validators';
import { cacheMiddleware, CACHE_DURATIONS } from '../services/cacheService';
import { rateLimiter, RATE_LIMITS } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @swagger
 * /funds:
 *   get:
 *     tags: ['Fonlar']
 *     summary: 'Tüm fonları listeler'
 *     description: 'Tüm yatırım fonlarını listeler ve filtreleme imkanı sunar'
 *     parameters:
 *       - name: page
 *         in: query
 *         description: 'Sayfa numarası'
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: 'Sayfa başına kayıt sayısı'
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: type
 *         in: query
 *         description: 'Fon tipi'
 *         schema:
 *           type: string
 *           enum: ['Hisse Senedi Şemsiye Fonu', 'Para Piyasası Şemsiye Fonu', 'Serbest Şemsiye Fonu']
 *       - name: code
 *         in: query
 *         description: 'Fon kodu'
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+$'
 *           example: 'AFT'
 *       - name: management_company
 *         in: query
 *         description: 'Portföy yönetim şirketi kodu'
 *         schema:
 *           type: string
 *       - name: tefas
 *         in: query
 *         description: 'TEFAS''ta işlem görme durumu'
 *         schema:
 *           type: boolean
 *       - name: sort
 *         in: query
 *         description: 'Sıralama alanı'
 *         schema:
 *           type: string
 *           enum: ['code', 'title', 'type', 'yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y']
 *           default: 'code'
 *       - name: order
 *         in: query
 *         description: 'Sıralama yönü'
 *         schema:
 *           type: string
 *           enum: ['ASC', 'DESC']
 *     responses:
 *       200:
 *         description: 'Başarılı'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedFundList'
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', 
    rateLimiter('funds-list', RATE_LIMITS.FUNDS_LIST.MAX, RATE_LIMITS.FUNDS_LIST.WINDOW_MINUTES),
    cacheMiddleware(CACHE_DURATIONS.FUNDS_LIST), 
    listFunds
);

/**
 * @swagger
 * /funds/compare:
 *   get:
 *     tags: ['Fonlar']
 *     summary: 'Fonları karşılaştırır'
 *     description: 'Seçilen fonların performanslarını karşılaştırır'
 *     parameters:
 *       - name: codes
 *         in: query
 *         required: true
 *         description: 'Karşılaştırılacak fon kodları (virgülle ayrılmış, örn: AK1,IYB2)'
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+(,[A-Z0-9]+)*$'
 *           example: 'AK1,IYB2'
 *     responses:
 *       200:
 *         description: 'Başarılı'
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FundYield'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
    '/compare',
    rateLimiter('comparison', RATE_LIMITS.FUND_COMPARE.MAX, RATE_LIMITS.FUND_COMPARE.WINDOW_MINUTES),
    validateComparisonRequest,
    cacheMiddleware(CACHE_DURATIONS.FUND_COMPARE),
    compareFunds
);

/**
 * @swagger
 * /funds/{code}:
 *   get:
 *     tags: ['Fonlar']
 *     summary: 'Fon detaylarını getirir'
 *     description: 'Belirtilen fonun detaylı bilgilerini getirir'
 *     parameters:
 *       - $ref: '#/components/parameters/FundCode'
 *     responses:
 *       200:
 *         description: 'Başarılı'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundYield'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/:code', 
    rateLimiter('fund-detail', RATE_LIMITS.FUND_DETAIL.MAX, RATE_LIMITS.FUND_DETAIL.WINDOW_MINUTES),
    validateFundCode, 
    cacheMiddleware(CACHE_DURATIONS.FUND_DETAIL), 
    getFundDetails
);

/**
 * @swagger
 * /funds/{code}/historical:
 *   get:
 *     tags: ['Fonlar']
 *     summary: 'Fonun geçmiş değerlerini getirir'
 *     description: 'Belirtilen fonun geçmiş birim pay değerlerini getirir'
 *     parameters:
 *       - $ref: '#/components/parameters/FundCode'
 *       - $ref: '#/components/parameters/StartDate'
 *       - $ref: '#/components/parameters/EndDate'
 *       - $ref: '#/components/parameters/Interval'
 *     responses:
 *       200:
 *         description: 'Başarılı'
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FundHistoricalValue'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
    '/:code/historical',
    rateLimiter('historical', RATE_LIMITS.FUND_HISTORY.MAX, RATE_LIMITS.FUND_HISTORY.WINDOW_MINUTES),
    validateFundCode,
    validateDateRange,
    cacheMiddleware(CACHE_DURATIONS.FUND_HISTORY),
    getFundHistoricalValues
);

export default router; 