import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { McpTool, McpToolRequest, McpToolResponse } from './types';
import { rateLimiter } from '../middleware/rateLimiter';

export class FonParamMcpServer {
    private app: express.Application;
    private tools: Map<string, McpTool> = new Map();
    private server: any;
    private isInitialized = false;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors({
            origin: ['https://claude.ai', 'http://localhost:*'],
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        }));
        this.app.use(express.json());
        
        // Rate limiting for MCP endpoints
        this.app.use('/mcp', rateLimiter);
    }

    private setupRoutes() {
        // MCP Protocol Endpoints
        
        // List available tools
        this.app.get('/mcp/tools', async (req: Request, res: Response) => {
            try {
                const tools = Array.from(this.tools.values()).map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema
                }));

                res.json({
                    jsonrpc: '2.0',
                    result: { tools },
                    id: req.query.id || '1'
                });
            } catch (error: any) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error.message
                    },
                    id: req.query.id || '1'
                });
            }
        });

        // Execute tool
        this.app.post('/mcp/tools/:toolName', async (req: Request, res: Response) => {
            const { toolName } = req.params;
            const { arguments: args, id } = req.body;

            try {
                if (!this.tools.has(toolName)) {
                    return res.status(404).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32601,
                            message: `Tool '${toolName}' not found`
                        },
                        id: id || '1'
                    });
                }

                const tool = this.tools.get(toolName)!;

                // API key validation (optional)
                const apiKey = req.headers['x-api-key'] || args?.apiKey;
                if (apiKey) {
                    // Rate limiting validation would be handled by middleware
                    console.log(`🔑 API Key provided for tool: ${toolName}`);
                }

                const result = await tool.execute(args || {});

                res.json({
                    jsonrpc: '2.0',
                    result: {
                        content: [{
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }]
                    },
                    id: id || '1'
                });

            } catch (error: any) {
                console.error(`❌ Tool '${toolName}' execution error:`, error);
                
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: `Error executing ${toolName}: ${error.message}`
                    },
                    id: id || '1'
                });
            }
        });

        // Server info endpoint
        this.app.get('/mcp/info', (req: Request, res: Response) => {
            res.json({
                name: 'fonparam-mcp',
                version: '1.0.0',
                description: 'FonParam Financial Data & Investment Analysis MCP Server',
                protocol: 'http',
                tools: Array.from(this.tools.keys()),
                endpoints: {
                    tools: '/mcp/tools',
                    execute: '/mcp/tools/:toolName',
                    info: '/mcp/info'
                }
            });
        });

        // Health check
        this.app.get('/mcp/health', (req: Request, res: Response) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                tools: this.tools.size
            });
        });
    }

    async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('✅ HTTP MCP Server initialized');
    }

    registerTool(tool: McpTool) {
        this.tools.set(tool.name, tool);
        console.log(`📋 Registered MCP tool: ${tool.name}`);
    }

    async start(port: number = 3001) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise<void>((resolve, reject) => {
            this.server = this.app.listen(port, () => {
                console.log(`🚀 FonParam HTTP MCP Server running on port ${port}`);
                console.log(`📊 Available at: http://localhost:${port}/mcp/info`);
                console.log(`🛠️  Tools endpoint: http://localhost:${port}/mcp/tools`);
                resolve();
            }).on('error', reject);
        });
    }

    async close() {
        if (this.server) {
            return new Promise<void>((resolve) => {
                this.server.close(() => {
                    console.log('🛑 HTTP MCP Server closed');
                    resolve();
                });
            });
        }
    }
} 