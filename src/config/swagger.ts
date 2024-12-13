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
                                enum: [
                                    'code',
                                    'title',
                                    'total_funds',
                                    'avg_yield_1d',
                                    'avg_yield_1w',
                                    'avg_yield_1m',
                                    'avg_yield_6m',
                                    'avg_yield_ytd',
                                    'avg_yield_1y',
                                    'avg_yield_3y',
                                    'avg_yield_5y'
                                ],
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
                                                logo: 'http://localhost:3000/public/logos/ata_portfoy_icon.png',
                                                total_funds: 22,
                                                avg_yield_1d: -0.0042,
                                                avg_yield_1w: 1.0066,
                                                avg_yield_1m: 5.4131,
                                                avg_yield_6m: 10.8271,
                                                avg_yield_ytd: 43.3379,
                                                avg_yield_1y: 45.65,
                                                avg_yield_3y: 313.4222,
                                                avg_yield_5y: 1750.9015,
                                                best_performing_funds: [
                                                    {
                                                        code: "NKJ",
                                                        title: "ATA PORTFÖY GIG SİGORTA SERBEST (TL) ÖZEL FON",
                                                        type: "serbest",
                                                        yield_1d: 0.3287,
                                                        yield_1w: 3.28,
                                                        yield_1m: 12.2927,
                                                        yield_3m: 17.3773,
                                                        yield_6m: 17.4993,
                                                        yield_ytd: 92.9748,
                                                        yield_1y: 104.1684,
                                                        yield_3y: 665.8415,
                                                        yield_5y: null
                                                    },
                                                    {
                                                        code: "PKF",
                                                        title: "ATA PORTFÖY ALTIN KATILIM FONU",
                                                        type: "katilim",
                                                        yield_1d: 0.115,
                                                        yield_1w: 0.397,
                                                        yield_1m: 2.511,
                                                        yield_3m: 9.5514,
                                                        yield_6m: 26.1391,
                                                        yield_ytd: 54.4689,
                                                        yield_1y: 61.8553,
                                                        yield_3y: null,
                                                        yield_5y: null
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
                                enum: [
                                    'altin',
                                    'borclanma_araclari',
                                    'degisken',
                                    'fon_sepeti',
                                    'gumus',
                                    'hisse_senedi',
                                    'hisse_senedi_yogun',
                                    'karma',
                                    'katilim',
                                    'kiymetli_madenler',
                                    'para_piyasasi',
                                    'serbest',
                                    'yabanci',
                                    'diger'
                                ]
                            }
                        },
                        {
                            name: 'search',
                            in: 'query',
                            description: 'Fon kodu, açıklaması, şirket kodu veya şirket adı ile arama',
                            schema: {
                                type: 'string'
                            }
                        },
                        {
                            name: 'code',
                            in: 'query',
                            description: 'Fon kodu veya kodları (virgülle ayrılmış)',
                            schema: {
                                type: 'string'
                            },
                            example: 'AAK,DAH'
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
                                enum: [
                                    // Fund temel alanları
                                    'code',
                                    'title',
                                    'tefas',

                                    // FundYield alanları
                                    'yield_1d',
                                    'yield_1w',
                                    'yield_1m',
                                    'yield_3m',
                                    'yield_6m',
                                    'yield_ytd',
                                    'yield_1y',
                                    'yield_3y',
                                    'yield_5y',

                                    // FundHistoricalValue alanları
                                    'last_historical_value.value',
                                    'last_historical_value.aum',
                                    'last_historical_value.shares_active',
                                    'last_historical_value.cumulative_cashflow',
                                    'last_historical_value.investor_count',

                                    // FundManagementCompany alanları
                                    'management_company.code',
                                    'management_company.title',

                                    // FundType alanları
                                    'fund_type.type',
                                    'fund_type.short_name',
                                    'fund_type.long_name',
                                    'fund_type.group_name'
                                ],
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
            '/funds/top-performing': {
                get: {
                    tags: ['Fonlar'],
                    summary: 'En iyi performans gösteren fonları listeler',
                    description: 'Rastgele 10 adet iyi performans gösteren fon getirir. İsteğe bağlı olarak referans fonlar belirterek, bu fonlara benzer performans gösteren fonları bulabilirsiniz.',
                    parameters: [
                        {
                            name: 'funds',
                            in: 'query',
                            description: 'Referans fon kodları (virgülle ayrılmış)',
                            schema: {
                                type: 'string'
                            },
                            example: 'AAK,DAH',
                            required: false
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
                        '404': {
                            description: 'Fon bulunamadı',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: {
                                                type: 'string',
                                                example: 'En iyi performans gösteren fonlar bulunamadı'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            $ref: '#/components/responses/ServerError'
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
                    description: 'Belirtilen fon için geçmiş verileri kullanarak yatırım analizi yapar',
                    parameters: [
                        {
                            name: 'code',
                            in: 'path',
                            required: true,
                            description: 'Fon kodu',
                            schema: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 10
                            },
                            example: 'AAK'
                        },
                        {
                            name: 'startDate',
                            in: 'query',
                            required: true,
                            description: 'Başlangıç tarihi',
                            schema: {
                                type: 'string',
                                enum: ['last_1_day',
                                    'last_1_week',
                                    'last_1_month',
                                    'last_3_months',
                                    'last_6_months',
                                    'year_start',
                                    'last_1_year',
                                    'last_3_years',
                                    'last_5_years'
                                ]
                            },
                            example: 'year_start'
                        },
                        {
                            name: 'initialInvestment',
                            in: 'query',
                            required: true,
                            description: 'Başlangıç yatırımı',
                            schema: {
                                type: 'number',
                                minimum: 0
                            },
                            example: 10000
                        },
                        {
                            name: 'monthlyInvestment',
                            in: 'query',
                            required: false,
                            description: 'Aylık yatırım tutarı',
                            schema: {
                                type: 'number',
                                minimum: 0,
                                default: 0
                            },
                            example: 1000
                        },
                        {
                            name: 'yearlyIncrease.type',
                            in: 'query',
                            required: false,
                            description: 'Yıllık artış tipi',
                            schema: {
                                type: 'string',
                                enum: ['percentage', 'amount']
                            },
                            example: 'percentage'
                        },
                        {
                            name: 'yearlyIncrease.value',
                            in: 'query',
                            required: false,
                            description: 'Yıllık artış değeri',
                            schema: {
                                type: 'number',
                                minimum: 0
                            },
                            example: 10
                        },
                        {
                            name: 'includeMonthlyDetails',
                            in: 'query',
                            required: false,
                            description: 'Aylık detayları getir',
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
                                            code: {
                                                type: 'string',
                                                description: 'Fon kodu',
                                                example: 'AAK'
                                            },
                                            management_company_id: {
                                                type: 'string',
                                                description: 'Portföy yönetim şirketi kodu',
                                                example: 'ATA'
                                            },
                                            title: {
                                                type: 'string',
                                                description: 'Fon adı',
                                                example: 'ATA PORTFÖY BİRİNCİ HİSSE SENEDİ FONU'
                                            },
                                            summary: {
                                                type: 'object',
                                                properties: {
                                                    totalInvestment: {
                                                        type: 'number',
                                                        description: 'Toplam yatırım',
                                                        example: 46000 // 10000 + (1000 * 36 ay)
                                                    },
                                                    currentValue: {
                                                        type: 'number',
                                                        description: 'Güncel değer',
                                                        example: 68432.50
                                                    },
                                                    totalYield: {
                                                        type: 'number',
                                                        description: 'Toplam getiri (tutar)',
                                                        example: 22432.50
                                                    },
                                                    totalYieldPercentage: {
                                                        type: 'number',
                                                        description: 'Toplam getiri (%)',
                                                        example: 48.77
                                                    }
                                                }
                                            },
                                            monthlyDetails: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        date: {
                                                            type: 'string',
                                                            description: 'Tarih',
                                                            example: '2024-11-05'
                                                        },
                                                        investment: {
                                                            type: 'number',
                                                            description: 'O ay yapılan yatırım',
                                                            example: 1331
                                                        },
                                                        totalInvestment: {
                                                            type: 'number',
                                                            description: 'O ana kadar yapılan toplam yatırım',
                                                            example: 44669
                                                        },
                                                        unitPrice: {
                                                            type: 'number',
                                                            description: 'Fon birim fiyatı',
                                                            example: 12.123
                                                        },
                                                        units: {
                                                            type: 'number',
                                                            description: 'O ay alınan pay adedi',
                                                            example: 109.791
                                                        },
                                                        totalUnits: {
                                                            type: 'number',
                                                            description: 'Toplam pay adedi',
                                                            example: 5350.120
                                                        },
                                                        value: {
                                                            type: 'number',
                                                            description: 'Yatırımın o ayki değeri',
                                                            example: 64856.50
                                                        },
                                                        monthlyChange: {
                                                            type: 'number',
                                                            description: 'O ayki değişim (tutar)',
                                                            example: 1567.89
                                                        },
                                                        monthlyChangePercentage: {
                                                            type: 'number',
                                                            description: 'O ayki değişim (%)',
                                                            example: 2.78
                                                        },
                                                        totalYield: {
                                                            type: 'number',
                                                            description: 'O ana kadarki toplam getiri (tutar)',
                                                            example: 3576.12
                                                        },
                                                        totalYieldPercentage: {
                                                            type: 'number',
                                                            description: 'O ana kadarki toplam getiri (%)',
                                                            example: 5.23
                                                        }
                                                    }
                                                },
                                                example: [
                                                    {
                                                        date: '2024-11-05',
                                                        investment: 1331,
                                                        totalInvestment: 44669,
                                                        unitPrice: 12.123,
                                                        units: 109.791,
                                                        totalUnits: 5350.120,
                                                        value: 64856.50,
                                                        monthlyChange: 1567.89,
                                                        monthlyChangePercentage: 2.78,
                                                        totalYield: 3576.12,
                                                        totalYieldPercentage: 5.23
                                                    },
                                                    {
                                                        date: '2024-12-05',
                                                        investment: 1331,
                                                        totalInvestment: 46000,
                                                        unitPrice: 12.543,
                                                        units: 106.114,
                                                        totalUnits: 5456.234,
                                                        value: 68432.50,
                                                        monthlyChange: 1234.56,
                                                        monthlyChangePercentage: 2.45,
                                                        totalYield: 4810.68,
                                                        totalYieldPercentage: 7.68
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            $ref: '#/components/responses/ValidationError'
                        },
                        '404': {
                            $ref: '#/components/responses/NotFound'
                        },
                        '500': {
                            $ref: '#/components/responses/ServerError'
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
                                enum: [
                                    'date',
                                    'value',
                                    'aum',
                                    'shares_active',
                                    'yield',
                                    'cumulative_cashflow',
                                    'investor_count'
                                ],
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
                                            type: 'object',
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
                                                    example: '2023-12-29'
                                                },
                                                value: {
                                                    type: 'number',
                                                    format: 'float',
                                                    description: 'Fon birim pay değeri',
                                                    example: 16.170459
                                                },
                                                aum: {
                                                    type: 'number',
                                                    format: 'float',
                                                    description: 'Portföy büyüklüğü',
                                                    example: 97469445.00
                                                },
                                                shares_active: {
                                                    type: 'number',
                                                    format: 'float',
                                                    description: 'Pay sayısı',
                                                    example: 6027624.00
                                                },
                                                yield: {
                                                    type: 'number',
                                                    format: 'float',
                                                    description: 'Günlük getiri (%)',
                                                    example: 1.064131
                                                },
                                                cumulative_cashflow: {
                                                    type: 'number',
                                                    format: 'float',
                                                    description: 'Kümülatif nakit akışı',
                                                    example: -29122.996659,
                                                    nullable: true
                                                },
                                                investor_count: {
                                                    type: 'integer',
                                                    description: 'Yatırımcı sayısı',
                                                    example: 666
                                                }
                                            }
                                        },
                                        example: [
                                            {
                                                "code": "AAK",
                                                "date": "2023-12-29",
                                                "value": 16.170459,
                                                "aum": 97469445.00,
                                                "shares_active": 6027624.00,
                                                "yield": 1.064131,
                                                "cumulative_cashflow": -29122.996659,
                                                "investor_count": 666
                                            },
                                            {
                                                "code": "AAK",
                                                "date": "2023-12-28",
                                                "value": 16.000196,
                                                "aum": 96471981.00,
                                                "shares_active": 6029425.00,
                                                "yield": 0.064597,
                                                "cumulative_cashflow": null,
                                                "investor_count": 665
                                            }
                                        ]
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
                            example: 'APY'
                        },
                        title: {
                            type: 'string',
                            description: 'Şirket adı',
                            example: 'ATA PORTFÖY YÖNETİMİ A.Ş.'
                        },
                        logo: {
                            type: 'string',
                            description: 'Şirket logosu URL',
                            example: 'http://localhost:3000/public/logos/ata_portfoy_icon.png'
                        },
                        total_funds: {
                            type: 'integer',
                            description: 'Toplam fon sayısı',
                            example: 42
                        },
                        avg_yield_1d: {
                            type: 'number',
                            format: 'float',
                            description: '1 günlük ortalama getiri',
                            example: 0.45
                        },
                        avg_yield_1w: {
                            type: 'number',
                            format: 'float',
                            description: '1 haftalık ortalama getiri',
                            example: 1.23
                        },
                        avg_yield_1m: {
                            type: 'number',
                            format: 'float',
                            description: '1 aylık ortalama getiri',
                            example: 2.45
                        },
                        avg_yield_6m: {
                            type: 'number',
                            format: 'float',
                            description: '6 aylık ortalama getiri',
                            example: 15.67
                        },
                        avg_yield_ytd: {
                            type: 'number',
                            format: 'float',
                            description: 'Yıl başından bugüne ortalama getiri',
                            example: 12.34
                        },
                        avg_yield_1y: {
                            type: 'number',
                            format: 'float',
                            description: '1 yıllık ortalama getiri',
                            example: 28.91
                        },
                        avg_yield_3y: {
                            type: 'number',
                            format: 'float',
                            description: '3 yıllık ortalama getiri',
                            example: 95.67
                        },
                        avg_yield_5y: {
                            type: 'number',
                            format: 'float',
                            description: '5 yıllık ortalama getiri',
                            example: 156.78
                        }
                    }
                },
                FundYield: {
                    type: 'object',
                    required: ['code', 'title', 'type'],
                    properties: {
                        code: {
                            type: 'string',
                            description: 'Fon kodu',
                            example: 'AAK'
                        },
                        title: {
                            type: 'string',
                            description: 'Fon adı',
                            example: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU'
                        },
                        tefas: {
                            type: 'boolean',
                            description: 'TEFAS\'ta işlem görüyor mu?',
                            example: true
                        },
                        yield_1d: {
                            type: 'number',
                            format: 'float',
                            description: '1 günlük getiri (%)',
                            example: '0.0929'
                        },
                        yield_1w: {
                            type: 'number',
                            format: 'float',
                            description: '1 haftalık getiri (%)',
                            example: '1.9517'
                        },
                        yield_1m: {
                            type: 'number',
                            format: 'float',
                            description: '1 aylık getiri (%)',
                            example: '7.1268'
                        },
                        yield_3m: {
                            type: 'number',
                            format: 'float',
                            description: '3 aylık getiri (%)',
                            example: '8.6255'
                        },
                        yield_6m: {
                            type: 'number',
                            format: 'float',
                            description: '6 aylık getiri (%)',
                            example: '12.4757'
                        },
                        yield_ytd: {
                            type: 'number',
                            format: 'float',
                            description: 'Yıl başından itibaren getiri (%)',
                            example: '49.6378'
                        },
                        yield_1y: {
                            type: 'number',
                            format: 'float',
                            description: '1 yıllık getiri (%)',
                            example: '52.4460'
                        },
                        yield_3y: {
                            type: 'number',
                            format: 'float',
                            description: '3 yıllık getiri (%)',
                            example: '309.1558'
                        },
                        yield_5y: {
                            type: 'number',
                            format: 'float',
                            description: '5 yıllık getiri (%)',
                            example: '600.6521'
                        },
                        type: {
                            type: 'string',
                            description: 'Fon tipi',
                            example: 'Değişken Fon',
                            enum: [
                                'Altın Fon',
                                'Borçlanma Araçları Fonu',
                                'Değişken Fon',
                                'Fon Sepeti Fonu',
                                'Gümüş Fon',
                                'Hisse Senedi Fonu',
                                'Hisse Senedi Yoğun Fon',
                                'Karma Fon',
                                'Katılım Fonu',
                                'Kıymetli Madenler Fonu',
                                'Para Piyasası Fonu',
                                'Serbest Fon',
                                'Yabancı Fon',
                                'Diğer Fon'
                            ]
                        },
                        management_company: {
                            type: 'object',
                            description: 'Portföy yönetim şirketi bilgileri',
                            properties: {
                                code: {
                                    type: 'string',
                                    description: 'Şirket kodu',
                                    example: 'APY'
                                },
                                title: {
                                    type: 'string',
                                    description: 'Şirket adı',
                                    example: 'ATA PORTFÖY YÖNETİMİ A.Ş.'
                                },
                                logo: {
                                    type: 'string',
                                    description: 'Şirket logo dosya adı',
                                    example: 'ata_portfoy_icon.png'
                                }
                            }
                        },
                        fund_type: {
                            type: 'object',
                            description: 'Fon tipi detayları',
                            properties: {
                                type: {
                                    type: 'string',
                                    description: 'Fon tipi kodu',
                                    example: 'degisken',
                                    enum: [
                                        'altin',
                                        'borclanma_araclari',
                                        'degisken',
                                        'fon_sepeti',
                                        'gumus',
                                        'hisse_senedi',
                                        'hisse_senedi_yogun',
                                        'karma',
                                        'katilim',
                                        'kiymetli_madenler',
                                        'para_piyasasi',
                                        'serbest',
                                        'yabanci',
                                        'diger'
                                    ]
                                },
                                short_name: {
                                    type: 'string',
                                    description: 'Fon tipi kısa adı',
                                    example: 'Değişken Fon'
                                },
                                long_name: {
                                    type: 'string',
                                    description: 'Fon tipi uzun adı',
                                    example: 'Değişken Şemsiye Fonu'
                                },
                                group_name: {
                                    type: 'string',
                                    description: 'Fon grubu adı',
                                    example: 'Değişken Fonlar'
                                }
                            }
                        },
                        last_historical_value: {
                            type: 'object',
                            description: 'Son tarihli değerler',
                            properties: {
                                date: {
                                    type: 'string',
                                    format: 'date',
                                    description: 'Değer tarihi',
                                    example: '2024-12-12'
                                },
                                value: {
                                    type: 'number',
                                    format: 'float',
                                    description: 'Fon birim pay değeri',
                                    example: '24.356291'
                                },
                                aum: {
                                    type: 'number',
                                    format: 'float',
                                    description: 'Dönem başı portföy büyüklüğü',
                                    example: '75387892.00'
                                },
                                shares_active: {
                                    type: 'number',
                                    format: 'float',
                                    description: 'Dönem başı pay sayısı',
                                    example: '3098089.00'
                                },
                                yield: {
                                    type: 'number',
                                    format: 'float',
                                    description: 'Günlük getiri (%)',
                                    example: '0.092937'
                                },
                                cumulative_cashflow: {
                                    type: 'number',
                                    format: 'float',
                                    description: 'Kümülatif nakit akışı',
                                    example: '-625703.708462'
                                },
                                investor_count: {
                                    type: 'integer',
                                    description: 'Dönem başı yatırımcı sayısı',
                                    example: 983
                                }
                            }
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
                            example: 1
                        },
                        page: {
                            type: 'integer',
                            description: 'Mevcut sayfa',
                            example: 1
                        },
                        limit: {
                            type: 'integer',
                            description: 'Sayfa başına fon sayısı',
                            example: 20
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
                            total_funds: 22,
                            avg_yield_1d: -0.0042,
                            avg_yield_1w: 1.0066,
                            avg_yield_1m: 5.4131,
                            avg_yield_6m: 10.8271,
                            avg_yield_ytd: 43.3379,
                            avg_yield_1y: 45.65,
                            avg_yield_3y: 313.4222,
                            avg_yield_5y: 1750.9015,
                        }
                    ]
                },
                CompanyDetails: {
                    type: 'object',
                    properties: {
                        company: {
                            $ref: '#/components/schemas/FundManagementCompany'
                        },
                        best_performing_funds: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    code: {
                                        type: 'string',
                                        description: 'Fon kodu',
                                        example: 'AAK'
                                    },
                                    title: {
                                        type: 'string',
                                        description: 'Fon adı',
                                        example: 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FONU'
                                    },
                                    type: {
                                        type: 'string',
                                        description: 'Fon tipi',
                                        example: 'degisken'
                                    },
                                    yield_1d: {
                                        type: 'number',
                                        format: 'float',
                                        description: '1 günlük getiri',
                                        example: 0.45
                                    },
                                    yield_1w: {
                                        type: 'number',
                                        format: 'float',
                                        description: '1 haftalık getiri',
                                        example: 1.23
                                    },
                                    yield_1m: {
                                        type: 'number',
                                        format: 'float',
                                        description: '1 aylık getiri',
                                        example: 3.45
                                    },
                                    yield_3m: {
                                        type: 'number',
                                        format: 'float',
                                        description: '3 aylık getiri',
                                        example: 8.90
                                    },
                                    yield_6m: {
                                        type: 'number',
                                        format: 'float',
                                        description: '6 aylık getiri',
                                        example: 18.23
                                    },
                                    yield_ytd: {
                                        type: 'number',
                                        format: 'float',
                                        description: 'Yıl başından bugüne getiri',
                                        example: 15.67
                                    },
                                    yield_1y: {
                                        type: 'number',
                                        format: 'float',
                                        description: '1 yıllık getiri',
                                        example: 32.45
                                    },
                                    yield_3y: {
                                        type: 'number',
                                        format: 'float',
                                        description: '3 yıllık getiri',
                                        example: 102.34
                                    },
                                    yield_5y: {
                                        type: 'number',
                                        format: 'float',
                                        description: '5 yıllık getiri',
                                        example: 178.90
                                    }
                                }
                            }
                        },
                        funds: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    code: {
                                        type: 'string',
                                        description: 'Fon kodu'
                                    },
                                    title: {
                                        type: 'string',
                                        description: 'Fon adı'
                                    },
                                    type: {
                                        type: 'string',
                                        description: 'Fon tipi'
                                    },
                                    yield: {
                                        type: 'object',
                                        properties: {
                                            yield_1d: {
                                                type: 'number',
                                                format: 'float',
                                                description: '1 günlük getiri'
                                            },
                                            yield_1w: {
                                                type: 'number',
                                                format: 'float',
                                                description: '1 haftalık getiri'
                                            },
                                            yield_1m: {
                                                type: 'number',
                                                format: 'float',
                                                description: '1 aylık getiri'
                                            },
                                            yield_3m: {
                                                type: 'number',
                                                format: 'float',
                                                description: '3 aylık getiri'
                                            },
                                            yield_6m: {
                                                type: 'number',
                                                format: 'float',
                                                description: '6 aylık getiri'
                                            },
                                            yield_ytd: {
                                                type: 'number',
                                                format: 'float',
                                                description: 'Yıl başından bugüne getiri'
                                            },
                                            yield_1y: {
                                                type: 'number',
                                                format: 'float',
                                                description: '1 yıllık getiri'
                                            },
                                            yield_3y: {
                                                type: 'number',
                                                format: 'float',
                                                description: '3 yıllık getiri'
                                            },
                                            yield_5y: {
                                                type: 'number',
                                                format: 'float',
                                                description: '5 yıllık getiri'
                                            }
                                        }
                                    }
                                }
                            }
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
                    description: 'Veri aralığı',
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
                },
                ServerError: {
                    description: 'Sunucu hatası',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: {
                                        type: 'string',
                                        description: 'Hata mesajı',
                                        example: 'Analiz hesaplanırken bir hata oluştu'
                                    },
                                    message: {
                                        type: 'string',
                                        description: 'Detaylı hata mesajı',
                                        example: 'Fon için veri bulunamadı'
                                    }
                                }
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