import 'dotenv/config';

// mysql2 khong hieu 'connectionString' va cung khong tu bat SSL tu
// query param 'ssl-mode=REQUIRED' cua Aiven -> tu parse DATABASE_URL
// thanh object chuan cua mysql2 va bat ssl tuong minh
const parseDatabaseUrl = (url) => {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false },
  };
};

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
    connection: parseDatabaseUrl(process.env.DATABASE_URL),
    migrations: {
      directory: './migrations'
    },
    seeds: { directory: './seeds' },
  }
};
