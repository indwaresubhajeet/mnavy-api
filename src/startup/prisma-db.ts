import { PrismaClient } from '@prisma/client';
import winston from 'winston';

interface DatabaseInfo {
  database_name: string;
  user_name: string;
  version: string;
  host: string | null; // Can be null if connection is local
}

interface ConnectionStats {
  max_conn: bigint;
  used: bigint;
}

interface ActivityStats {
  state: string;
  count: bigint;
}

// Single Prisma instance
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  return prisma;
}

async function testDatabaseConnection(): Promise<void> {
  try {
    winston.info('Testing database connection...');

    const client = getPrismaClient();
    await client.$connect();

    // Basic connection test
    await client.$queryRaw<DatabaseInfo[]>`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version,
        inet_server_addr() as host
    `;

    // Connection pool stats
    const connectionStats = await client.$queryRaw<ConnectionStats[]>`
      SELECT 
        setting::int as max_conn,
        (SELECT count(*) FROM pg_stat_activity WHERE state IS NOT NULL) as used
      FROM pg_settings WHERE name = 'max_connections'
    `;

    const activityStats = await client.$queryRaw<ActivityStats[]>`
      SELECT 
        COALESCE(state, 'unknown') as state,
        count(*) as count
      FROM pg_stat_activity 
      WHERE pid != pg_backend_pid()
      GROUP BY state
      ORDER BY count DESC
    `;

    // Calculate stats - Convert BigInt to numbers for calculations
    const stats = connectionStats[0];
    if (!stats) {
      throw new Error('Could not retrieve connection stats from the database.');
    }
    const maxConn = Number(stats.max_conn);
    const used = Number(stats.used);

    const active = Number(
      activityStats.find((s: { state: string }) => s.state === 'active')?.count || 0,
    );
    const idle = Number(
      activityStats.find((s: { state: string }) => s.state === 'idle')?.count || 0,
    );
    const idleInTxn = Number(
      activityStats.find((s: { state: string }) => s.state === 'idle in transaction')?.count || 0,
    );

    const free = maxConn - used;
    const utilization = Math.round((used / maxConn) * 100);

    // Format host for display
    // const formatHost = (host: string | null): string => {
    //   if (!host) return 'localhost';
    //   if (host === '::1') return 'localhost (IPv6)';
    //   if (host === '127.0.0.1') return 'localhost (IPv4)';
    //   return host;
    // };

    winston.info('Database connected successfully!');
    winston.info(
      `Max: ${maxConn}, Free: ${free}, Active: ${active}, Idle: ${idle}, Idle-in-txn: ${idleInTxn}, Utilization: ${utilization}%`,
    );

    if (utilization > 80) winston.warn('High connection usage!');
  } catch (error: unknown) {
    winston.error('Database connection failed:', (error as Error).message);
    throw error;
  }
}

// Cleanup on process termination
async function cleanup(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Setup cleanup handlers
const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
signals.forEach((signal): void => {
  process.on(signal, (async (): Promise<void> => {
    await cleanup();
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  }) as () => void);
});

// Initialize and export
export async function initDatabase(): Promise<PrismaClient> {
  await testDatabaseConnection();
  return getPrismaClient();
}

export { getPrismaClient };

// Export a clean instance for easy importing in routes
export const db: PrismaClient = getPrismaClient();
