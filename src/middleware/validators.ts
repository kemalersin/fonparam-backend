import { Request, Response, NextFunction } from 'express';
import { query, param, validationResult, ValidationChain, body } from 'express-validator';

// Validasyon sonuçlarını kontrol eden middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Fon listesi için validasyon kuralları
export const listFundsValidation: ValidationChain[] = [
    query('code').optional().isString().isLength({ min: 1, max: 10 }),
    query('type').optional().isString(),
    query('management_company').optional().isString().isLength({ max: 10 }),
    query('tefas').optional().isBoolean(),
    query('min_yield_1m').optional().isFloat(),
    query('max_yield_1m').optional().isFloat(),
    query('min_yield_3m').optional().isFloat(),
    query('max_yield_3m').optional().isFloat(),
    query('min_yield_6m').optional().isFloat(),
    query('max_yield_6m').optional().isFloat(),
    query('min_yield_ytd').optional().isFloat(),
    query('max_yield_ytd').optional().isFloat(),
    query('min_yield_1y').optional().isFloat(),
    query('max_yield_1y').optional().isFloat(),
    query('min_yield_3y').optional().isFloat(),
    query('max_yield_3y').optional().isFloat(),
    query('min_yield_5y').optional().isFloat(),
    query('max_yield_5y').optional().isFloat(),
    query('sort').optional().isIn(['code', 'title', 'type', 'yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y']),
    query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().isLength({ min: 1, max: 100 })
];

// validate'i ayrı kullan
export const validateListFunds = [
    ...listFundsValidation,
    validate
];

// Tek fon detayı için validasyon kuralları
export const getFundValidation = [
    param('code').isString().isLength({ min: 1, max: 10 })
];

export const validateGetFund = [
    ...getFundValidation,
    validate
];

// Fon geçmişi için validasyon kuralları
export const getFundHistoryValidation = [
    param('code').isString().isLength({ min: 1, max: 10 }),
    query('start_date').optional().isDate(),
    query('end_date').optional().isDate(),
    query('interval').optional().isIn(['daily', 'weekly', 'monthly']),
    query('sort').optional().isIn(['date', 'value']),
    query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC'])
];

export const validateFundHistory = [
    ...getFundHistoryValidation,
    validate
];

// Fon karşılaştırma için validasyon kuralları
export const compareFundsValidation = [
    query('codes')
        .isString()
        .notEmpty()
        .withMessage('Karşılaştırılacak fon kodları gerekli')
        .custom(value => {
            const codes = value.split(',');
            if (codes.length < 2 || codes.length > 5) {
                throw new Error('En az 2, en fazla 5 fon karşılaştırılabilir');
            }
            if (codes.some((code: string) => !code.trim())) {
                throw new Error('Geçersiz fon kodu formatı');
            }
            return true;
        })
];

export const validateCompareFunds = [
    ...compareFundsValidation,
    validate
];

// Şirket listesi için validasyon kuralları
export const listCompaniesValidation: ValidationChain[] = [
    query('search').optional().isString().isLength({ min: 1, max: 100 }),
    query('min_total_funds').optional().isInt({ min: 0 }),
    query('max_total_funds').optional().isInt({ min: 0 }),
    query('min_avg_yield_1m').optional().isFloat(),
    query('max_avg_yield_1m').optional().isFloat(),
    query('min_avg_yield_1y').optional().isFloat(),
    query('max_avg_yield_1y').optional().isFloat(),
    query('sort').optional().isIn(['title', 'total_funds', 'avg_yield_1m', 'avg_yield_1y']),
    query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];

export const validateListCompanies = [
    ...listCompaniesValidation,
    validate
];

// Tek şirket detayı için validasyon kuralları
export const getCompanyValidation = [
    param('code').isString().isLength({ min: 2, max: 10 }),
    query('include_funds').optional().isBoolean()
];

export const validateCompanyCode = [
    param('code')
        .isString()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Şirket kodu 2-10 karakter uzunluğunda olmalıdır'),
    validate
];

export const validateGetCompany = [
    ...getCompanyValidation,
    validateCompanyCode
];

export const validateFundCode = [
    param('code')
        .isString()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Fon kodu 2-10 karakter uzunluğunda olmalıdır'),
    validate
];

export const validateDateRange = [
    query('start_date')
        .optional()
        .isDate()
        .withMessage('Başlangıç tarihi geçerli bir tarih olmalıdır'),
    query('end_date')
        .optional()
        .isDate()
        .withMessage('Bitiş tarihi geçerli bir tarih olmalıdır'),
    query('interval')
        .optional()
        .isIn(['daily', 'weekly', 'monthly'])
        .withMessage('Geçersiz aralık değeri'),
    validate
];

export const validateComparisonRequest = [
    query('codes')
        .isString()
        .notEmpty()
        .withMessage('Karşılaştırılacak fon kodları gerekli')
        .custom((value: string) => {
            const codes = value.split(',').map(code => code.trim());
            
            if (codes.length < 2) {
                throw new Error('En az 2 fon karşılaştırılmalıdır');
            }
            if (codes.length > 5) {
                throw new Error('En fazla 5 fon karşılaştırılabilir');
            }
            if (codes.some(code => !code)) {
                throw new Error('Geçersiz fon kodu formatı');
            }
            if (codes.some(code => !/^[A-Z0-9]+$/.test(code))) {
                throw new Error('Fon kodları sadece büyük harf ve rakam içerebilir');
            }
            if (new Set(codes).size !== codes.length) {
                throw new Error('Aynı fon birden fazla kez belirtilemez');
            }

            return true;
        }),
    validate
]; 