import { Request } from 'express';
import { ParsedQs } from 'qs';

export enum FundTypeEnum {
    ALTIN = 'altin',
    BORCLANMA_ARACLARI = 'borclanma_araclari',
    DEGISKEN = 'degisken',
    FON_SEPETI = 'fon_sepeti',
    GUMUS = 'gumus',
    HISSE_SENEDI = 'hisse_senedi',
    HISSE_SENEDI_YOGUN = 'hisse_senedi_yogun',
    KARMA = 'karma',
    KATILIM = 'katilim',
    KIYMETLI_MADENLER = 'kiymetli_madenler',
    PARA_PIYASASI = 'para_piyasasi',
    SERBEST = 'serbest',
    YABANCI = 'yabanci',
    DIGER = 'diger'
}

export interface FundManagementCompany {
    code: string;
    title: string;
    logo?: string;
    total_funds?: number;
    avg_yield_1d?: number;
    avg_yield_1w?: number;
    avg_yield_1m?: number;
    avg_yield_3m?: number;
    avg_yield_6m?: number;
    avg_yield_ytd?: number;
    avg_yield_1y?: number;
    avg_yield_3y?: number;
    avg_yield_5y?: number;
}

export interface Fund {
    code: string;
    management_company_id: string;
    title: string;
    type: FundTypeEnum;
    tefas?: boolean;
    has_historical_data: boolean;
    historical_data_check_date?: Date;
}

export interface FundType {
    type: string;
    short_name: string;
    long_name: string;
    group_name: string;
}

export interface FundTypeYields {
    type: string;
    yield_1d?: number;
    yield_1w?: number;
    yield_1m?: number;
    yield_3m?: number;
    yield_6m?: number;
    yield_ytd?: number;
    yield_1y?: number;
    yield_3y?: number;
    yield_5y?: number;
    total_funds: number;
    total_aum?: number;
}

export interface FundYield {
    code: string;
    yield_1d?: number;
    yield_1w?: number;
    yield_1m?: number;
    yield_3m?: number;
    yield_6m?: number;
    yield_ytd?: number;
    yield_1y?: number;
    yield_3y?: number;
    yield_5y?: number;
}

export interface FundHistoricalValue {
    code: string;
    date: Date;
    value: number;
    aum?: number;
    shares_active?: number;
    yield?: number;
    cumulative_cashflow?: number;
    investor_count?: number;
}

export interface PaginatedResponse<T> {
    total: number;
    page: number;
    limit: number;
    data: T[];
}

export interface FundFilters extends ParsedQs {
    search?: string;
    code?: string;
    type?: string;
    management_company?: string;
    tefas?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
    [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

export interface TypedRequest<T extends ParsedQs> extends Request {
    query: T;
}

export interface CompanyFilters extends ParsedQs {
    search?: string;
    min_total_funds?: string;
    max_total_funds?: string;
    min_avg_yield_1m?: string;
    max_avg_yield_1m?: string;
    min_avg_yield_1y?: string;
    max_avg_yield_1y?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
    page?: string;
    limit?: string;
    [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

export interface TypedCompanyRequest<T extends ParsedQs> extends Request {
    query: T;
} 