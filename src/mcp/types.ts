export interface McpToolRequest {
    id?: string;
    method?: string;
    params?: {
        name: string;
        arguments?: Record<string, any>;
    };
    arguments?: Record<string, any>;
}

export interface McpToolResponse {
    jsonrpc: string;
    id: string;
    result?: {
        content: Array<{
            type: string;
            text?: string;
            data?: any;
        }>;
        isError?: boolean;
    };
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface McpHttpResponse {
    jsonrpc: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: string;
}

export interface FundAnalysisParams {
    fundCode: string;
    initialInvestment: number;
    monthlyInvestment?: number;
    startDate: string;
    yearlyIncrease?: {
        type: 'percentage' | 'amount';
        value: number;
    };
    includeMonthlyDetails?: boolean;
    apiKey?: string;
}

export interface FundComparisonParams {
    fundCodes: string[];
    metrics?: string[];
    period?: string;
    apiKey?: string;
}

export interface MarketInsightsParams {
    fundType?: string;
    timeframe?: string;
    limit?: number;
    apiKey?: string;
}

export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    execute: (params: any) => Promise<any>;
} 