import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('loyalty.db');
    await initializeSchema(db);
  }
  return db;
}

async function initializeSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      totalPoints INTEGER DEFAULT 0,
      tier TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      pointsRequired INTEGER NOT NULL,
      isActive INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      amount REAL NOT NULL,
      pointsEarned INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      pointsRedeemed INTEGER NOT NULL,
      discountValue REAL NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export async function upsertCustomers(customers: any[]) {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    for (const c of customers) {
      await database.runAsync(
        'INSERT OR REPLACE INTO customers (id, name, email, phone, totalPoints, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [c.id, c.name, c.email || '', c.phone || '', c.totalPoints || 0, c.createdAt, c.createdAt]
      );
    }
  });
}

export async function upsertRewards(rewards: any[]) {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    for (const r of rewards) {
      await database.runAsync(
        'INSERT OR REPLACE INTO rewards (id, title, description, pointsRequired, isActive) VALUES (?, ?, ?, ?, ?)',
        [
          r.id, 
          r.rewardDescription || 'Reward', 
          r.rewardDescription || '', 
          r.pointsRequired || 0, 
          r.isActive ? 1 : 0
        ]
      );
    }
  });
}

export async function upsertPurchases(purchases: any[]) {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    for (const p of purchases) {
      await database.runAsync(
        'INSERT OR REPLACE INTO purchases (id, customerId, amount, pointsEarned, createdAt) VALUES (?, ?, ?, ?, ?)',
        [p.id, p.customerId, Number(p.amount), p.pointsEarned, p.createdAt]
      );
    }
  });
}

export async function upsertRedemptions(redemptions: any[]) {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    for (const r of redemptions) {
      await database.runAsync(
        'INSERT OR REPLACE INTO redemptions (id, customerId, pointsRedeemed, discountValue, createdAt) VALUES (?, ?, ?, ?, ?)',
        [r.id, r.customerId, r.pointsRedeemed, Number(r.discountValue), r.createdAt]
      );
    }
  });
}

export async function getLocalSummary() {
  const database = await getDb();
  
  const customerCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM customers');
  const purchaseCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM purchases');
  const redemptionCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM redemptions');
  const revenueAgg = await database.getFirstAsync<{ sum: number }>('SELECT SUM(amount) as sum FROM purchases');
  const pointsAgg = await database.getFirstAsync<{ sum: number }>('SELECT SUM(totalPoints) as sum FROM customers');
  
  return {
    totalCustomers: customerCount?.count ?? 0,
    totalPurchases: purchaseCount?.count ?? 0,
    totalRedemptions: redemptionCount?.count ?? 0,
    totalRevenue: revenueAgg?.sum ?? 0,
    totalPointsOutstanding: pointsAgg?.sum ?? 0,
  };
}
