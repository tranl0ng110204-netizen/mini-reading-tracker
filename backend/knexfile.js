import 'dotenv/config';

export default {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracking_book',
      port: process.env.DB_PORT || 3306,
    },
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations'
    },
     seeds: { directory: './seeds' },
  }
};
