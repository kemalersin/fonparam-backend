#!/usr/bin/env node

/**
 * Standalone HTTP MCP Server Entry Point
 * 
 * This file allows running the FonParam HTTP MCP server independently
 * from the main Express.js application.
 * 
 * Usage:
 * npm run mcp-server
 * or
 * node dist/mcp.js [port]
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
const envPath = path.resolve(process.cwd(), envFile);
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Import and start HTTP MCP server
import { startMcpServer } from './mcp/index';

// Get port from command line arguments or environment
const port = parseInt(process.argv[2]) || parseInt(process.env.MCP_PORT || '3001');

console.log('🚀 Starting FonParam HTTP MCP Server...');
console.log('📊 Turkish Mutual Fund Analysis & Investment Advisory AI');
console.log('🔗 HTTP-based Model Context Protocol Server for Financial Data');
console.log('---------------------------------------------------');

startMcpServer(port).catch((error: any) => {
    console.error('💥 HTTP MCP Server startup failed:', error);
    process.exit(1);
}); 