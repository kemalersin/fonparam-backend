import dotenv from 'dotenv';
import path from 'path';

// Environment dosyasını yükle
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
const envPath = path.resolve(process.cwd(), envFile);
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Database modülünü yükle
import sequelize from './config/database';

// Diğer importlar
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';
import fundRoutes from './routes/fundRoutes';
import companyRoutes from './routes/companyRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import fundTypeRoutes from './routes/fundTypeRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import apiLogRoutes from './routes/apiLogRoutes';
import inflationRoutes from './routes/inflationRoutes';
import { rateLimiter } from './middleware/rateLimiter';
import { apiLogger } from './middleware/apiLogger';
import redisClient from './config/redis';

// MCP imports (optional)
import { initializeMcpServer, FonParamMcpServer } from './mcp/index';

// Global MCP server instance
let mcpServer: FonParamMcpServer | null = null;

// Redis bağlantısını başlat ve bekle
const initializeApp = async () => {
    try {
        // Veritabanı bağlantısını test et
        try {
            await sequelize.authenticate();
            console.log('Veritabanı bağlantısı başarılı');
        } catch (dbError) {
            console.error('Veritabanı bağlantı hatası:', dbError);
            process.exit(1);
        }

        await redisClient.connect();
        console.log('Redis bağlantısı başarılı');

        // HTTP MCP Server'ı başlat (isteğe bağlı)
        if (process.env.ENABLE_MCP_SERVER === 'true') {
            try {
                console.log('🔧 Initializing HTTP MCP Server...');
                mcpServer = await initializeMcpServer();
                
                // HTTP MCP Server'ı ayrı portta başlat
                const mcpPort = parseInt(process.env.MCP_PORT || '3001');
                await mcpServer.start(mcpPort);
                console.log(`✅ HTTP MCP Server running on port ${mcpPort}`);
                console.log(`🔗 MCP Endpoints: http://localhost:${mcpPort}/mcp/info`);
            } catch (mcpError) {
                console.warn('⚠️ HTTP MCP Server initialization failed:', mcpError);
                console.log('📝 Application will continue without MCP functionality');
            }
        } else {
            console.log('📝 HTTP MCP Server disabled (set ENABLE_MCP_SERVER=true to enable)');
        }

        const app = express();

        // Proxy güvenini ayarla
        app.set('trust proxy', true);

        // Middleware
        app.use(helmet({
            crossOriginResourcePolicy: {
                policy: 'cross-origin'
            }
        }));
        app.use(cors());
        app.use(express.json());

        // API Logger - tüm istekleri logla
        app.use(apiLogger);

        // Statik dosya servisi
        app.use('/public', express.static('../public'));

        // Swagger UI
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: "FonParam API Dokümantasyonu"
        }));

        // API key yönetim rotaları (rate limiter'dan muaf)
        app.use('/api-keys', apiKeyRoutes);

        // API log yönetim rotaları (rate limiter'dan muaf)
        app.use('/api-logs', apiLogRoutes);

        // Global rate limiter'ı tüm API rotalarına uygula
        app.use(['/funds', '/companies', '/statistics', '/fund-types', '/inflation'], rateLimiter);

        // Routes
        app.use('/funds', fundRoutes);
        app.use('/companies', companyRoutes);
        app.use('/statistics', statisticsRoutes);
        app.use('/fund-types', fundTypeRoutes);
        app.use('/inflation', inflationRoutes);

        // Error handling
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack);
            res.status(500).json({
                error: 'Bir hata oluştu',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        // 404 handling
        app.use((req: Request, res: Response) => {
            res.status(404).json({ error: 'Sayfa bulunamadı' });
        });

        // Redis bağlantısını kapat
        process.on('SIGTERM', async () => {
            console.log('🛑 Graceful shutdown initiated...');
            
            try {
                // MCP Server'ı kapat
                if (mcpServer) {
                    console.log('🔧 Closing MCP Server...');
                    await mcpServer.close();
                }
                
                // Redis bağlantısını kapat
                await redisClient.quit();
                console.log('✅ Cleanup completed');
            } catch (error) {
                console.error('❌ Shutdown error:', error);
            }
            
            process.exit(0);
        });

        const PORT = process.env.PORT || 3000;
        const ENV = process.env.NODE_ENV || 'development';

        app.listen(PORT, () => {
            console.log(`Server ${PORT} portunda çalışıyor (${ENV} modu)`);
            console.log(`API Dokümantasyonu: ${process.env.API_URL}/api-docs`);
        });
    } catch (error) {
        console.error('Redis bağlantı hatası:', error);
        process.exit(1);
    }
};

initializeApp(); 