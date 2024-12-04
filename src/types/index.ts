import { Request } from 'express';
import { ParsedQs } from 'qs';

export interface FundManagementCompany {
    code: string;
    title: string;
    logo?: string;
}

export interface FundYield {
    code: string;
    management_company_id?: string;
    title: string;
    type?: string;
    tefas?: boolean;
    yield_1m?: number;
    yield_3m?: number;
    yield_6m?: number;
    yield_ytd?: number;
    yield_1y?: number;
    yield_3y?: number;
    yield_5y?: number;
    management_company?: FundManagementCompany;
}

export interface FundHistoricalValue {
    code: string;
    date: Date;
    value?: number;
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