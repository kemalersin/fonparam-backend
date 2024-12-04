import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fonparam API',
            version: '1.0.0',
            description: `
# Fonparam REST API Dökümantasyonu

Fonparam, Türkiye'deki yatırım fonlarının verilerini sunan bir API servisidir. 
Bu API ile fonların güncel ve geçmiş verilerine erişebilir, karşılaştırmalar yapabilir ve detaylı analizler gerçekleştirebilirsiniz.

## Özellikler

- 📊 Tüm yatırım fonlarının güncel verileri
- 📈 Geçmiş performans verileri
- 🔍 Gelişmiş filtreleme ve arama
- 📊 Fon karşılaştırma
- 🏢 Portföy yönetim şirketi bilgileri

## Rate Limiting

- Genel istekler: 100 istek/dakika
- Geçmiş veri istekleri: 50 istek/dakika
- Karşılaştırma istekleri: 30 istek/dakika

## Önbellek (Cache)

- Fon listesi: 5 dakika
- Fon detayı: 10 dakika
- Geçmiş veriler: 30 dakika
- Karşılaştırma: 5 dakika
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
                                type: 'string'
                            }
                        },
                        {
                            name: 'include_funds',
                            in: 'query',
                            description: 'Şirketin fonlarını da getir',
                            schema: {
                                type: 'boolean',
                                default: true
                            }
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
                                                code: 'AK',
                                                title: 'Ak Portföy Yönetimi A.Ş.',
                                                logo: 'https://example.com/logo.png'
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
                                                        code: 'AK1',
                                                        title: 'Ak Portföy Birinci Fon',
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
                                type: 'string'
                            }
                        },
                        {
                            name: 'start_date',
                            in: 'query',
                            description: 'Başlangıç tarihi (YYYY-MM-DD)',
                            schema: {
                                type: 'string',
                                format: 'date'
                            }
                        },
                        {
                            name: 'end_date',
                            in: 'query',
                            description: 'Bitiş tarihi (YYYY-MM-DD)',
                            schema: {
                                type: 'string',
                                format: 'date'
                            }
                        },
                        {
                            name: 'interval',
                            in: 'query',
                            description: 'Veri aralığı',
                            schema: {
                                type: 'string',
                                enum: ['daily', 'weekly', 'monthly']
                            }
                        },
                        {
                            name: 'sort',
                            in: 'query',
                            description: 'Sıralama alanı',
                            schema: {
                                type: 'string',
                                enum: ['date', 'value'],
                                default: 'date'
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
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/FundHistoricalValue'
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
                            example: 'AFT'
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
                            description: 'Karşılaştırılacak fon kodları (virgülle ayrılmış, örn: AK1,IYB2)',
                            schema: {
                                type: 'string',
                                pattern: '^[A-Z0-9]+(,[A-Z0-9]+)*$'
                            },
                            example: 'AK1,IYB2'
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
                                                    example: ['AK1']
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
            }
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
                            example: 'Ak Portföy Yönetimi A.Ş.',
                            minLength: 3,
                            maxLength: 100
                        },
                        logo: {
                            type: 'string',
                            description: 'Şirket logosu URL',
                            example: 'https://example.com/logo.png',
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
                            example: 'AK1',
                            minLength: 2,
                            maxLength: 10
                        },
                        management_company_id: {
                            type: 'string',
                            description: 'Yönetim şirketi kodu',
                            example: 'AK',
                            minLength: 2,
                            maxLength: 10
                        },
                        title: {
                            type: 'string',
                            description: 'Fon adı',
                            example: 'Ak Portföy Birinci Fon',
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
                            example: 'AK1'
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
                            code: 'AK',
                            title: 'Ak Portföy Yönetimi A.Ş.',
                            logo: 'https://example.com/logo.png',
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
                            code: 'AK',
                            title: 'Ak Portföy Yönetimi A.Ş.',
                            logo: 'https://example.com/logo.png'
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
                                    code: 'AK1',
                                    title: 'Ak Portföy Birinci Fon',
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
                    example: 'AK1'
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
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
};

export default swaggerJsdoc(options); 