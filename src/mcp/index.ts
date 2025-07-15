import { FonParamMcpServer } from './server';
import { fundAnalysisTool } from './tools/fundAnalysis';
import { fundComparisonTool } from './tools/fundComparison';
import { marketInsightsTool } from './tools/marketInsights';
import McpAuthBridge from './auth';

/**
 * Initialize and configure the FonParam HTTP MCP Server
 */
export async function initializeMcpServer(): Promise<FonParamMcpServer> {
    const mcpServer = new FonParamMcpServer();
    
    // Initialize the server first
    await mcpServer.initialize();

    // Register all tools
    mcpServer.registerTool(fundAnalysisTool);
    mcpServer.registerTool(fundComparisonTool);
    mcpServer.registerTool(marketInsightsTool);

    console.log('🔧 All MCP tools registered successfully');
    
    return mcpServer;
}

/**
 * Start the HTTP MCP server (for standalone MCP usage)
 */
export async function startMcpServer(port: number = 3001): Promise<void> {
    try {
        const mcpServer = await initializeMcpServer();
        await mcpServer.start(port);
        
        console.log('🌐 HTTP MCP Server Details:');
        console.log(`   • Server Info: http://localhost:${port}/mcp/info`);
        console.log(`   • Tools List: http://localhost:${port}/mcp/tools`);
        console.log(`   • Health Check: http://localhost:${port}/mcp/health`);
        console.log(`   • Tool Execution: POST http://localhost:${port}/mcp/tools/{toolName}`);
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down HTTP MCP server...');
            await mcpServer.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down HTTP MCP server...');
            await mcpServer.close();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start HTTP MCP server:', error);
        process.exit(1);
    }
}

export {
    FonParamMcpServer,
    McpAuthBridge,
    fundAnalysisTool,
    fundComparisonTool,
    marketInsightsTool
};

// Export types for external usage
export type { McpAuthContext } from './auth';
export type { 
    McpTool, 
    FundAnalysisParams, 
    FundComparisonParams, 
    MarketInsightsParams 
} from './types'; 