import { Request, Response, NextFunction } from 'express';
import { query, param, validationResult, ValidationChain, body } from 'express-validator';
import { FundTypeEnum } from '../types';

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
    query('sort').optional().isIn([
        'code',
        'title',
        'tefas',
        'yield_1d',
        'yield_1w',
        'yield_1m',
        'yield_3m',
        'yield_6m',
        'yield_ytd',
        'yield_1y',
        'yield_3y',
        'yield_5y',
        'last_historical_value.value',
        'last_historical_value.aum',
        'last_historical_value.shares_active',
        'last_historical_value.cumulative_cashflow',
        'last_historical_value.investor_count',
        'management_company.code',
        'management_company.title',
        'fund_type.type',
        'fund_type.short_name',
        'fund_type.long_name',
        'fund_type.group_name'
    ]),
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
    query('sort').optional().isIn(['code',
        'title',
        'total_funds',
        'avg_yield_1d',
        'avg_yield_1w',
        'avg_yield_1m',
        'avg_yield_3m',
        'avg_yield_6m',
        'avg_yield_ytd',
        'avg_yield_1y',
        'avg_yield_3y',
        'avg_yield_5y']),
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
        .withMessage('Bitiş tarihi geçerli bir tarih olmalıdır')
        .custom((endDate: string, { req }) => {
            const startDate = req.query.start_date;
            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                throw new Error('Başlangıç tarihi, bitiş tarihinden büyük olamaz');
            }
            return true;
        }),
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

export const validateAnalysisRequest = [
    param('code')
        .isString()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Fon kodu 2-10 karakter uzunluğunda olmalıdır'),
    query('startDate')
        .optional()
        .isIn([
            'last_1_day',
            'last_1_week',
            'last_1_month',
            'last_3_months',
            'last_6_months',
            'last_1_year',
            'last_3_years',
            'last_5_years',
            'year_start'
        ])
        .withMessage('Geçersiz başlangıç tarihi'),
    query('initialInvestment')
        .isFloat({ min: 0 })
        .withMessage('Başlangıç yatırımı 0 veya daha büyük olmalıdır'),
    query('monthlyInvestment')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Aylık yatırım 0 veya daha büyük olmalıdır')
        .default(0),
    query('yearlyIncrease.type')
        .optional()
        .isIn(['percentage', 'amount'])
        .withMessage('Geçersiz yıllık artış tipi'),
    query('yearlyIncrease.value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Yıllık artış değeri 0 veya daha büyük olmalıdır'),
    query('includeMonthlyDetails')
        .optional()
        .isBoolean()
        .withMessage('Aylık detaylar boolean olmalıdır')
        .default(true),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Tarih parametresi için validasyon
export const validateDateParam = [
    param('date')
        .isDate()
        .withMessage('Geçerli bir tarih girilmelidir (YYYY-MM-DD)'),
    validate
];

// Fon tipi parametresi için validasyon
export const validateFundType = [
    param('type')
        .isString()
        .custom(value => {
            if (!Object.values(FundTypeEnum).includes(value as FundTypeEnum)) {
                throw new Error('Geçersiz fon tipi');
            }
            return true;
        }),
    validate
];

// İstatistik listesi için validasyon
export const validateStatisticsList = [
    query('start_date')
        .optional()
        .isDate()
        .withMessage('Başlangıç tarihi geçerli bir tarih olmalıdır (YYYY-MM-DD)'),
    query('end_date')
        .optional()
        .isDate()
        .withMessage('Bitiş tarihi geçerli bir tarih olmalıdır (YYYY-MM-DD)'),
    query('sort')
        .optional()
        .isIn(['date', 'total_funds', 'total_companies', 'total_investors', 'total_aum', 'avg_profit', 'avg_loss'])
        .withMessage('Geçersiz sıralama alanı'),
    query('order')
        .optional()
        .isIn(['ASC', 'DESC', 'asc', 'desc'])
        .withMessage('Geçersiz sıralama yönü'),
    validate
];

// Fon tipleri listesi için validasyon kuralları
export const listFundTypesValidation: ValidationChain[] = [
    query('sort').optional().isIn(['type', 'short_name', 'long_name', 'group_name']),
    query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
    query('min_total_funds').optional().isInt({ min: 0 }).withMessage('Minimum fon sayısı 0 veya daha büyük olmalıdır'),
    query('max_total_funds').optional().isInt({ min: 0 }).withMessage('Maksimum fon sayısı 0 veya daha büyük olmalıdır')
        .custom((value, { req }) => {
            if (!req.query) return true;
            const min = req.query.min_total_funds ? parseInt(req.query.min_total_funds.toString()) : 0;
            const max = parseInt(value);
            if (max < min) {
                throw new Error('Maksimum fon sayısı minimum fon sayısından küçük olamaz');
            }
            return true;
        })
];

export const validateListFundTypes = [
    ...listFundTypesValidation,
    validate
];