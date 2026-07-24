import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('DatabaseInit');

export async function initializeDatabase(config: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): Promise<void> {
  const adminPool = new Pool({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: config.password,
  });

  try {
    const result = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
      config.database,
    ]);

    if (result.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${config.database}`);
      logger.log(`Database created: ${config.database}`);
    }
  } finally {
    await adminPool.end();
  }

  const pool = new Pool(config);
  try {
    const schemaPath = path.join(
      __dirname,
      'database',
      'schema',
      '001_initial_schema.sql',
    );
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
  } finally {
    await pool.end();
  }
}
