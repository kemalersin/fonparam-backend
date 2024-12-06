import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FonParam API',
            version: '1.0.0',
            description: `
# FonParam REST API Dökümantasyonu

FonParam, Türkiye'deki yatırım fonlarının verilerini sunan bir API servisidir. 
Bu API ile fonların güncel ve geçmiş verilerine erişebilir, karşılaştırmalar yapabilir ve detaylı analizler gerçekleştirebilirsiniz.

## Özellikler

- 📊 Tüm yatırım fonlarının güncel verileri
- 📈 Geçmiş performans verileri
- 🔍 Gelişmiş filtreleme ve arama
- 📊 Fon karşılaştırma
- 🏢 Portföy yönetim şirketi bilgileri

## Rate Limiting

API'nin tüm endpointleri için rate limiting uygulanmaktadır:

- Her endpoint için 15 dakikada maksimum 25 istek yapılabilir
- Her endpoint için günlük maksimum 100 istek yapılabilir
- Rate limit aşıldığında 429 (Too Many Requests) hatası döner
- Rate limit sayaçları IP bazlı tutulur
- Whitelist'teki IP ve domain'ler rate limit'ten etkilenmez

## Önbellek (Cache)

Performansı artırmak için önbellek kullanılmaktadır:

- Fon listesi: 5 dakika
- Fon detayı: 10 dakika
- Fon analizi: 30 dakika
- Geçmiş veriler: 30 dakika
- Karşılaştırma: 5 dakika
- Şirket listesi: 5 dakika
- Şirket detayı: 10 dakika
            `,
            contact: {
                name: 'API Desteği',
                email: 'mail@kemalersin.com',
                url: 'https://fonparam.com/docs'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Geliştirme Ortamı'
            },
            {
                url: 'https://api.fonparam.com',
                description: 'Prodüksiyon Ortamı'
            }
        ],
        tags: [
            {
                name: 'Fonlar',
                description: 'Yatırım fonları ile ilgili tüm operasyonlar'
            },
            {
                name: 'Portföy Yönetim Şirketleri',
                description: 'Portföy yönetim şirketleri ile ilgili operasyonlar'
            }
        ],
        paths: {
            '/companies': {
                get: {
                    tags: ['Portföy Yönetim Şirketleri'],
                    summary: 'Tüm portföy yönetim şirketlerini listeler',
                    description: 'Portföy yönetim şirketlerini ve ortalama getiri istatistiklerini listeler',
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            description: 'Sayfa numarası',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                default: 1
                            }
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            description: 'Sayfa başına kayıt sayısı',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                default: 20
                            }
                        },
                        {
                            name: 'sort',
                            in: 'query',
                            description: 'Sıralama alanı',
                            schema: {
                                type: 'string',
                                enum: ['code', 'title', 'total_funds', 'avg_yield_1m', 'avg_yield_6m', 'avg_yield_ytd', 'avg_yield_1y', 'avg_yield_3y', 'avg_yield_5y'],
                                default: 'code'
                            }
                        },
                        {
                            name: 'order',
                            in: 'query',
                            description: 'Sıralama yönü',
                            schema: {
                                type: 'string',
                                enum: ['ASC', 'DESC']
                            }
                        },
                        {
                            name: 'min_total_funds',
                            in: 'query',
                            description: 'Minimum fon sayısı'
                        },
                        {
                            name: 'max_total_funds',
                            in: 'query',
                            description: 'Maksimum fon sayısı'
                        },
                        {
                            name: 'search',
                            in: 'query',
                            description: 'Şirket adı veya kodu ile arama'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Başarılı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            total: {
                                                type: 'integer',
                                                description: 'Toplam kayıt sayısı'
                                            },
                                            page: {
                                                type: 'integer',
                                                description: 'Mevcut sayfa'
                                            },
                                            limit: {
                                                type: 'integer',
                                                description: 'Sayfa başına kayıt sayısı'
                                            },
                                            data: {
                                                $ref: '#/components/schemas/CompanyList'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            $ref: '#/components/responses/ValidationError'
                        }
                    }
                }
            },
            '/companies/{code}': {
                get: {
                    tags: ['Portföy Yönetim Şirketleri'],
                    summary: 'Portföy yönetim şirketi detaylarını getirir',
                    description: 'Belirtilen portföy yönetim şirketinin detaylarını ve istatistiklerini getirir',
                    parameters: [
                        {
                            name: 'code',
                            in: 'path',
                            required: true,
                            description: 'Şirket kodu',
                            schema: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 10
                            },
                            example: 'APY'
                        },
                        {
                            name: 'include_funds',
                            in: 'query',
                            description: 'Şirketin fonlarını da getir',
                            schema: {
                                type: 'boolean',
                                default: true
                            },
                            example: true
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Başarılı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            company: {
                                                $ref: '#/components/schemas/FundManagementCompany'
                                            },
                                            stats: {
                                                $ref: '#/components/schemas/CompanyStatistics'
                                            }
                                        },
                                        example: {
                                            company: {
                                                code: 'APY',
                                                title: 'ATA PORTFÖY YÖNETİMİ A.Ş.',
                                                logo: 'ata_portfoy_icon.png'
                                            },
                                            stats: {
                                                total_funds: 42,
                                                avg_yield_1m: 2.45,
                                                avg_yield_6m: 15.67,
                                                avg_yield_ytd: 12.34,
                                                avg_yield_1y: 28.91,
                                                avg_yield_3y: 95.67,
                                                avg_yield_5y: 156.78,
                                                best_performing_funds: [
                                                    {
                                                        code: 'AAK',
                                                        title: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU',
                                                        type: 'Hisse Senedi',
                                                        yield_1m: 3.45,
                                                        yield_1y: 32.45
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '404': {
                            $ref: '#/components/responses/NotFound'
                        },
                        '500': {
                            $ref: '#/components/responses/ValidationError'
                        }
                    }
                }
            },
            '/funds': {
                get: {
                    tags: ['Fonlar'],
                    summary: 'Tüm fonları listeler',
                    description: 'Tüm yatırım fonlarını listeler ve filtreleme imkanı sunar',
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            description: 'Sayfa numarası',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                default: 1
                            }
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            description: 'Sayfa başına kayıt sayısı',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                default: 20
                            }
                        },
                        {
                            name: 'type',
                            in: 'query',
                            description: 'Fon tipi',
                            schema: {
                                type: 'string',
                                enum: ['Hisse Senedi Şemsiye Fonu', 'Para Piyasası Şemsiye Fonu', 'Serbest Şemsiye Fonu']
                            }
                        },
                        {
                            name: 'code',
                            in: 'query',
                            description: 'Fon kodu',
                            schema: {
                                type: 'string',
                                pattern: '^[A-Z0-9]+$'
                            },
                            example: 'AAK'
                        },
                        {
                            name: 'management_company',
                            in: 'query',
                            description: 'Portföy yönetim şirketi kodu',
                            schema: {
                                type: 'string'
                            }
                        },
                        {
                            name: 'tefas',
                            in: 'query',
                            description: "TEFAS'ta işlem görme durumu",
                            schema: {
                                type: 'boolean'
                            }
                        },
                        {
                            name: 'sort',
                            in: 'query',
                            description: 'Sıralama alanı',
                            schema: {
                                type: 'string',
                                enum: ['code', 'title', 'type', 'yield_1m', 'yield_3m', 'yield_6m', 'yield_ytd', 'yield_1y', 'yield_3y', 'yield_5y'],
                                default: 'code'
                            }
                        },
                        {
                            name: 'order',
                            in: 'query',
                            description: 'Sıralama yönü',
                            schema: {
                                type: 'string',
                                enum: ['ASC', 'DESC']
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Başarılı',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/PaginatedFundList'
                                    }
                                }
                            }
                        },
                        '500': {
                            $ref: '#/components/responses/ValidationError'
                        }
                    }
                }
            },
            '/funds/compare': {
                get: {
                    tags: ['Fonlar'],
                    summary: 'Fonları karşılaştırır',
                    description: 'Seçilen fonların performanslarını karşılaştırır',
                    parameters: [
                        {
                            name: 'codes',
                            in: 'query',
                            required: true,
                            description: 'Karşılaştırılacak fon kodları (virgülle ayrılmış, örn: AAK,GPB)',
                            schema: {
                                type: 'string',
                                pattern: '^[A-Z0-9]+(,[A-Z0-9]+)*$'
                            },
                            example: 'AAK,GPB'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Başarılı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/FundYield'
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Geçersiz istek',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: {
                                                type: 'string',
                                                example: 'Karşılaştırılacak fon kodları gerekli'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Fon bulunamadı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: {
                                                type: 'string',
                                                example: 'Belirtilen fonlar bulunamadı'
                                            },
                                            missing_codes: {
                                                type: 'array',
                                                items: {
                                                    type: 'string',
                                                    example: ['AAK']
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            $ref: '#/components/responses/ValidationError'
                        }
                    }
                }
            },
            '/funds/{code}/analyze': {
                get: {
                    tags: ['Fonlar'],
                    summary: 'Fon için yatırım analizi yapar',
                    description: 'Belirtilen fon için başlangıç yatırımı ve aylık düzenli yatırım ile getiri analizi yapar',
                    parameters: [
                        {
                            in: 'path',
                            name: 'code',
                            required: true,
                            schema: {
                                type: 'string'
                            },
                            description: 'Fon kodu',
                            example: 'AAK'
                        },
                        {
                            in: 'query',
                            name: 'startDate',
                            required: true,
                            schema: {
                                type: 'string',
                                enum: ['5_years_ago', '3_years_ago', '1_year_ago', 'year_start', '6_months_ago', '3_months_ago', '1_month_ago']
                            },
                            description: 'Başlangıç tarihi',
                            example: '5_years_ago'
                        },
                        {
                            in: 'query',
                            name: 'initialInvestment',
                            required: true,
                            schema: {
                                type: 'number',
                                minimum: 0
                            },
                            description: 'Başlangıç yatırımı',
                            example: 10000
                        },
                        {
                            in: 'query',
                            name: 'monthlyInvestment',
                            required: true,
                            schema: {
                                type: 'number',
                                minimum: 0
                            },
                            description: 'Aylık düzenli yatırım',
                            example: 1000
                        },
                        {
                            in: 'query',
                            name: 'yearlyIncrease.type',
                            required: true,
                            schema: {
                                type: 'string',
                                enum: ['percentage', 'amount']
                            },
                            description: 'Yıllık artış tipi',
                            example: 'percentage'
                        },
                        {
                            in: 'query',
                            name: 'yearlyIncrease.value',
                            required: true,
                            schema: {
                                type: 'number',
                                minimum: 0
                            },
                            description: 'Yıllık artış değeri',
                            example: 20
                        },
                        {
                            in: 'query',
                            name: 'includeMonthlyDetails',
                            required: false,
                            schema: {
                                type: 'boolean'
                            },
                            description: 'Aylık detayları dahil et',
                            example: true
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Başarılı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['code', 'management_company_id', 'title', 'summary'],
                                        properties: {
                                            code: {
                                                type: 'string',
                                                example: 'AAK',
                                                description: 'Fon kodu'
                                            },
                                            management_company_id: {
                                                type: 'string',
                                                description: 'Portföy yönetim şirketi kodu',
                                                example: 'APY'
                                            },
                                            title: {
                                                type: 'string',
                                                description: 'Fon adı',
                                                example: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU'
                                            },
                                            summary: {
                                                type: 'object',
                                                required: ['totalInvestment', 'currentValue', 'totalYield', 'totalYieldPercentage'],
                                                properties: {
                                                    totalInvestment: {
                                                        type: 'number',
                                                        description: 'Toplam yatırılan para',
                                                        example: 100000
                                                    },
                                                    currentValue: {
                                                        type: 'number',
                                                        description: 'Güncel değer',
                                                        example: 100000
                                                    },
                                                    totalYield: {
                                                        type: 'number',
                                                        description: 'Toplam getiri (tutar)',
                                                        example: 100000
                                                    },
                                                    totalYieldPercentage: {
                                                        type: 'number',
                                                        description: 'Toplam getiri (%)',
                                                        example: 10
                                                    }
                                                }
                                            },
                                            monthlyDetails: {
                                                type: 'array',
                                                description: 'Aylık detaylar (includeMonthlyDetails=true ise)',
                                                items: {
                                                    type: 'object',
                                                    required: ['date', 'investment', 'totalInvestment', 'unitPrice', 'units', 'totalUnits', 'value', 'yield', 'yieldPercentage'],
                                                    properties: {
                                                        date: {
                                                            type: 'string',
                                                            format: 'date',
                                                            description: 'Tarih',
                                                            example: '2024-01-01'
                                                        },
                                                        investment: {
                                                            type: 'number',
                                                            description: 'O ay yapılan yatırım',
                                                            example: 1000
                                                        },
                                                        totalInvestment: {
                                                            type: 'number',
                                                            description: 'O ana kadar yapılan toplam yatırım',
                                                            example: 10000
                                                        },
                                                        unitPrice: {
                                                            type: 'number',
                                                            description: 'Fon birim fiyatı',
                                                            example: 10
                                                        },
                                                        units: {
                                                            type: 'number',
                                                            description: 'O ay alınan pay adedi',
                                                            example: 100
                                                        },
                                                        totalUnits: {
                                                            type: 'number',
                                                            description: 'Toplam pay adedi',
                                                            example: 1000
                                                        },
                                                        value: {
                                                            type: 'number',
                                                            description: 'Yatırımın o ayki değeri',
                                                            example: 10000
                                                        },
                                                        yield: {
                                                            type: 'number',
                                                            description: 'O ayki getiri (tutar)',
                                                            example: 100
                                                        },
                                                        yieldPercentage: {
                                                            type: 'number',
                                                            description: 'O ayki getiri (%)',
                                                            example: 10
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Geçersiz parametreler'
                        },
                        '404': {
                            description: 'Fon bulunamadı'
                        },
                        '500': {
                            description: 'Sunucu hatası'
                        }
                    }
                }
            },
            '/funds/{code}/historical': {
                get: {
                    tags: ['Fonlar'],
                    summary: 'Fonun geçmiş değerlerini getirir',
                    description: 'Belirtilen fonun geçmiş birim pay değerlerini getirir',
                    parameters: [
                        {
                            name: 'code',
                            in: 'path',
                            description: 'Fon kodu',
                            required: true,
                            schema: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 10
                            },
                            example: 'AAK'
                        },
                        {
                            name: 'start_date',
                            in: 'query',
                            description: 'Başlangıç tarihi (YYYY-MM-DD)',
                            schema: {
                                type: 'string',
                                format: 'date',
                                default: '2023-01-01'
                            },
                            example: '2023-01-01'
                        },
                        {
                            name: 'end_date',
                            in: 'query',
                            description: 'Bitiş tarihi (YYYY-MM-DD)',
                            schema: {
                                type: 'string',
                                format: 'date',
                                default: '2023-12-31'
                            },
                            example: '2023-12-31'
                        },
                        {
                            name: 'interval',
                            in: 'query',
                            description: 'Veri aralığı',
                            schema: {
                                type: 'string',
                                enum: ['daily', 'weekly', 'monthly'],
                                default: 'daily'
                            },
                            example: 'daily'
                        },
                        {
                            name: 'sort',
                            in: 'query',
                            description: 'Sıralama alanı',
                            schema: {
                                type: 'string',
                                enum: ['date', 'value'],
                                default: 'date'
                            },
                            example: 'date'
                        },
                        {
                            name: 'order',
                            in: 'query',
                            description: 'Sıralama yönü',
                            schema: {
                                type: 'string',
                                enum: ['ASC', 'DESC'],
                                default: 'DESC'
                            },
                            example: 'DESC'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Başarılı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/FundHistoricalValue'
                                        },
                                        example: [
                                            {
                                                code: 'AAK',
                                                date: '2023-12-31',
                                                value: 12.345
                                            },
                                            {
                                                code: 'AAK',
                                                date: '2023-12-30',
                                                value: 12.123
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        '404': {
                            $ref: '#/components/responses/NotFound'
                        },
                        '500': {
                            $ref: '#/components/responses/ValidationError'
                        }
                    }
                }
            },
        },
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Hata mesajı',
                            example: 'Geçersiz fon kodu'
                        }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    param: {
                                        type: 'string',
                                        description: 'Hatalı parametre',
                                        example: 'code'
                                    },
                                    msg: {
                                        type: 'string',
                                        description: 'Hata mesajı',
                                        example: 'Fon kodu geçerli değil'
                                    },
                                    value: {
                                        type: 'string',
                                        description: 'Gönderilen değer',
                                        example: 'INVALID'
                                    }
                                }
                            }
                        }
                    }
                },
                FundManagementCompany: {
                    type: 'object',
                    required: ['code', 'title'],
                    properties: {
                        code: {
                            type: 'string',
                            description: 'Şirket kodu',
                            example: 'AK',
                            minLength: 2,
                            maxLength: 10
                        },
                        title: {
                            type: 'string',
                            description: 'Şirket adı',
                            example: 'ATA PORTFÖY YÖNETİMİ A.Ş.',
                            minLength: 3,
                            maxLength: 100
                        },
                        logo: {
                            type: 'string',
                            description: 'Şirket logosu URL',
                            example: 'ata_portfoy_icon.png',
                            format: 'uri'
                        }
                    }
                },
                FundYield: {
                    type: 'object',
                    required: ['code', 'management_company_id', 'title', 'type'],
                    properties: {
                        code: {
                            type: 'string',
                            description: 'Fon kodu',
                            example: 'AAK',
                            minLength: 2,
                            maxLength: 10
                        },
                        management_company_id: {
                            type: 'string',
                            description: 'Yönetim şirketi kodu',
                            example: 'APY',
                            minLength: 2,
                            maxLength: 10
                        },
                        title: {
                            type: 'string',
                            description: 'Fon adı',
                            example: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU',
                            minLength: 3,
                            maxLength: 100
                        },
                        type: {
                            type: 'string',
                            description: 'Fon tipi',
                            example: 'Hisse Senedi',
                            enum: [
                                'Hisse Senedi',
                                'Borçlanma Araçları',
                                'Karma',
                                'Para Piyasası',
                                'Altın',
                                'Serbest',
                                'Diğer'
                            ]
                        },
                        tefas: {
                            type: 'boolean',
                            description: 'TEFAS\'ta işlem görme durumu',
                            example: true
                        },
                        yield_1m: {
                            type: 'number',
                            format: 'float',
                            description: '1 aylık getiri (%)',
                            example: 5.43
                        },
                        yield_3m: {
                            type: 'number',
                            format: 'float',
                            description: '3 aylık getiri (%)',
                            example: 15.67
                        },
                        yield_6m: {
                            type: 'number',
                            format: 'float',
                            description: '6 aylık getiri (%)',
                            example: 32.45
                        },
                        yield_ytd: {
                            type: 'number',
                            format: 'float',
                            description: 'Yıl başından itibaren getiri (%)',
                            example: 28.91
                        },
                        yield_1y: {
                            type: 'number',
                            format: 'float',
                            description: '1 yıllık getiri (%)',
                            example: 45.78
                        },
                        yield_3y: {
                            type: 'number',
                            format: 'float',
                            description: '3 yıllık getiri (%)',
                            example: 123.45
                        },
                        yield_5y: {
                            type: 'number',
                            format: 'float',
                            description: '5 yıllık getiri (%)',
                            example: 234.56
                        },
                        management_company: {
                            $ref: '#/components/schemas/FundManagementCompany',
                            description: 'Portföy yönetim şirketi bilgileri'
                        }
                    }
                },
                FundHistoricalValue: {
                    type: 'object',
                    required: ['code', 'date', 'value'],
                    properties: {
                        code: {
                            type: 'string',
                            description: 'Fon kodu',
                            example: 'AAK'
                        },
                        date: {
                            type: 'string',
                            format: 'date',
                            description: 'Değer tarihi',
                            example: '2023-01-01'
                        },
                        value: {
                            type: 'number',
                            format: 'float',
                            description: 'Fon birim pay değeri',
                            example: 12.345
                        }
                    }
                },
                PaginatedFundList: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            description: 'Toplam fon sayısı',
                            example: 542
                        },
                        page: {
                            type: 'integer',
                            description: 'Mevcut sayfa',
                            example: 1,
                            minimum: 1
                        },
                        limit: {
                            type: 'integer',
                            description: 'Sayfa başına fon sayısı',
                            example: 20,
                            minimum: 1,
                            maximum: 100
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/FundYield'
                            }
                        }
                    }
                },
                CompanyStatistics: {
                    type: 'object',
                    properties: {
                        total_funds: {
                            type: 'integer',
                            description: 'Toplam fon sayısı'
                        },
                        avg_yield_1m: {
                            type: 'number',
                            nullable: true,
                            description: '1 aylık ortalama getiri'
                        },
                        avg_yield_6m: {
                            type: 'number',
                            nullable: true,
                            description: '6 aylık ortalama getiri'
                        },
                        avg_yield_ytd: {
                            type: 'number',
                            nullable: true,
                            description: 'Yıl başından bugüne ortalama getiri'
                        },
                        avg_yield_1y: {
                            type: 'number',
                            nullable: true,
                            description: '1 yıllık ortalama getiri'
                        },
                        avg_yield_3y: {
                            type: 'number',
                            nullable: true,
                            description: '3 yıllık ortalama getiri'
                        },
                        avg_yield_5y: {
                            type: 'number',
                            nullable: true,
                            description: '5 yıllık ortalama getiri'
                        },
                        best_performing_funds: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/FundYield'
                            },
                            description: 'En iyi performans gösteren fonlar'
                        }
                    }
                },
                CompanyList: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'Şirket kodu'
                            },
                            title: {
                                type: 'string',
                                description: 'Şirket adı'
                            },
                            logo: {
                                type: 'string',
                                description: 'Şirket logosu'
                            },
                            total_funds: {
                                type: 'integer',
                                description: 'Toplam fon sayısı'
                            },
                            avg_yield_1m: {
                                type: 'number',
                                nullable: true,
                                description: '1 aylık ortalama getiri'
                            },
                            avg_yield_6m: {
                                type: 'number',
                                nullable: true,
                                description: '6 aylık ortalama getiri'
                            },
                            avg_yield_ytd: {
                                type: 'number',
                                nullable: true,
                                description: 'Yıl başından bugüne ortalama getiri'
                            },
                            avg_yield_1y: {
                                type: 'number',
                                nullable: true,
                                description: '1 yıllık ortalama getiri'
                            },
                            avg_yield_3y: {
                                type: 'number',
                                nullable: true,
                                description: '3 yıllık ortalama getiri'
                            },
                            avg_yield_5y: {
                                type: 'number',
                                nullable: true,
                                description: '5 yıllık ortalama getiri'
                            }
                        }
                    },
                    example: [
                        {
                            code: 'APY',
                            title: 'ATA PORTFÖY YÖNETİMİ A.Ş.',
                            logo: 'ata_portfoy_icon.png',
                            total_funds: 42,
                            avg_yield_1m: 2.45,
                            avg_yield_6m: 15.67,
                            avg_yield_ytd: 12.34,
                            avg_yield_1y: 28.91,
                            avg_yield_3y: 95.67,
                            avg_yield_5y: 156.78
                        }
                    ]
                },
                CompanyDetails: {
                    type: 'object',
                    properties: {
                        company: {
                            $ref: '#/components/schemas/FundManagementCompany'
                        },
                        stats: {
                            $ref: '#/components/schemas/CompanyStatistics'
                        }
                    },
                    example: {
                        company: {
                            code: 'APY',
                            title: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU',
                            logo: 'ata_portfoy_icon.png'
                        },
                        stats: {
                            total_funds: 42,
                            avg_yield_1m: 2.45,
                            avg_yield_6m: 15.67,
                            avg_yield_ytd: 12.34,
                            avg_yield_1y: 28.91,
                            avg_yield_3y: 95.67,
                            avg_yield_5y: 156.78,
                            best_performing_funds: [
                                {
                                    code: 'AAK',
                                    title: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU',
                                    type: 'Hisse Senedi',
                                    yield_1m: 3.45,
                                    yield_6m: 18.23,
                                    yield_ytd: 15.67,
                                    yield_1y: 32.45,
                                    yield_3y: 102.34,
                                    yield_5y: 178.90
                                }
                            ]
                        }
                    }
                }
            },
            parameters: {
                FundCode: {
                    name: 'code',
                    in: 'path',
                    description: 'Fon kodu',
                    required: true,
                    schema: {
                        type: 'string',
                        minLength: 2,
                        maxLength: 10
                    },
                    example: 'AAK'
                },
                StartDate: {
                    name: 'start_date',
                    in: 'query',
                    description: 'Başlangıç tarihi (YYYY-MM-DD)',
                    schema: {
                        type: 'string',
                        format: 'date'
                    },
                    example: '2023-01-01'
                },
                EndDate: {
                    name: 'end_date',
                    in: 'query',
                    description: 'Bitiş tarihi (YYYY-MM-DD)',
                    schema: {
                        type: 'string',
                        format: 'date'
                    },
                    example: '2023-12-31'
                },
                Interval: {
                    name: 'interval',
                    in: 'query',
                    description: 'Veri aralı��ı',
                    schema: {
                        type: 'string',
                        enum: ['daily', 'weekly', 'monthly']
                    },
                    example: 'daily'
                }
            },
            responses: {
                NotFound: {
                    description: 'İstenilen kayıt bulunamadı',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Geçersiz istek parametreleri',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValidationError'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
};

export default swaggerJsdoc(options); 