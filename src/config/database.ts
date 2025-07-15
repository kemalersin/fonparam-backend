import { Sequelize } from 'sequelize';

// Database konfigürasyonunu kontrol et
const dbConfig = {
    database: process.env.DB_NAME || 'fonparam',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost'
};

console.log('Database Config in database.ts:', {
    ...dbConfig,
    password: dbConfig.password ? '[HIDDEN]' : 'empty'
});

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: 'mysql',
        dialectOptions: {
            charset: 'utf8mb4',
            timezone: 'local'
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        timezone: 'Europe/Istanbul'
    }
);

export default sequelize; 