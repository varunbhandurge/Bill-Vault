// ==============================================================================
// ASSETCARE - PERSISTENT DATABASE ABSTRACTION & DATA ACCESS LAYER
// Supports file-persisted local store + auto-seeding + production ready queries
// ==============================================================================

import fs from 'fs';
import path from 'path';
import {
  User,
  Category,
  Asset,
  Document,
  OCRRecord,
  ServiceRecord,
  Warranty,
  Reminder,
  ReminderLog,
  AuditLog,
  SystemStats,
} from './schema';
import {
  DEFAULT_USERS,
  DEFAULT_CATEGORIES,
  DEFAULT_ASSETS,
  DEFAULT_DOCUMENTS,
  DEFAULT_SERVICE_RECORDS,
  DEFAULT_WARRANTIES,
  DEFAULT_REMINDERS,
  DEFAULT_AUDIT_LOGS,
} from './seed';

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  assets: Asset[];
  documents: Document[];
  ocr_records: OCRRecord[];
  service_records: ServiceRecord[];
  warranties: Warranty[];
  reminders: Reminder[];
  reminder_logs: ReminderLog[];
  audit_logs: AuditLog[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'assetcare_db.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function readDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading database file:', error);
  }

  // If not found or error, initialize with seed
  const initialData: DatabaseSchema = {
    users: DEFAULT_USERS,
    categories: DEFAULT_CATEGORIES,
    assets: DEFAULT_ASSETS,
    documents: DEFAULT_DOCUMENTS,
    ocr_records: [],
    service_records: DEFAULT_SERVICE_RECORDS,
    warranties: DEFAULT_WARRANTIES,
    reminders: DEFAULT_REMINDERS,
    reminder_logs: [],
    audit_logs: DEFAULT_AUDIT_LOGS,
  };

  writeDatabase(initialData);
  return initialData;
}

function writeDatabase(data: DatabaseSchema): void {
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

// ------------------------------------------------------------------------------
// USERS
// ------------------------------------------------------------------------------
export const dbUsers = {
  getAll: (): User[] => {
    return readDatabase().users;
  },

  getById: (id: string): User | undefined => {
    return readDatabase().users.find((u) => u.id === id);
  },

  getByUsername: (username: string): User | undefined => {
    return readDatabase().users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  },

  getByEmail: (email: string): User | undefined => {
    return readDatabase().users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },

  create: (user: User): User => {
    const db = readDatabase();
    db.users.push(user);
    writeDatabase(db);
    return user;
  },

  update: (id: string, updates: Partial<User>): User | null => {
    const db = readDatabase();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDatabase(db);
    return db.users[index];
  },

  delete: (id: string): boolean => {
    const db = readDatabase();
    const initLen = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length !== initLen) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// ------------------------------------------------------------------------------
// CATEGORIES
// ------------------------------------------------------------------------------
export const dbCategories = {
  getAll: (): Category[] => {
    return readDatabase().categories;
  },

  getById: (id: string): Category | undefined => {
    return readDatabase().categories.find((c) => c.id === id);
  },

  create: (category: Category): Category => {
    const db = readDatabase();
    db.categories.push(category);
    writeDatabase(db);
    return category;
  },

  update: (id: string, updates: Partial<Category>): Category | null => {
    const db = readDatabase();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    db.categories[idx] = { ...db.categories[idx], ...updates };
    writeDatabase(db);
    return db.categories[idx];
  },

  delete: (id: string): boolean => {
    const db = readDatabase();
    const initLen = db.categories.length;
    db.categories = db.categories.filter((c) => c.id !== id);
    if (db.categories.length !== initLen) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// ------------------------------------------------------------------------------
// ASSETS
// ------------------------------------------------------------------------------
export const dbAssets = {
  getAll: (filter?: { userId?: string; categoryId?: string; search?: string }): Asset[] => {
    let assets = readDatabase().assets;

    if (filter?.userId) {
      assets = assets.filter((a) => a.user_id === filter.userId);
    }
    if (filter?.categoryId) {
      assets = assets.filter((a) => a.category_id === filter.categoryId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          (a.registration_number && a.registration_number.toLowerCase().includes(q)) ||
          (a.serial_number && a.serial_number.toLowerCase().includes(q))
      );
    }

    return assets;
  },

  getById: (id: string): Asset | undefined => {
    return readDatabase().assets.find((a) => a.id === id);
  },

  getByQRCode: (qrCodeId: string): Asset | undefined => {
    return readDatabase().assets.find((a) => a.qr_code_id === qrCodeId);
  },

  create: (asset: Asset): Asset => {
    const db = readDatabase();
    db.assets.push(asset);
    writeDatabase(db);
    return asset;
  },

  update: (id: string, updates: Partial<Asset>): Asset | null => {
    const db = readDatabase();
    const idx = db.assets.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    db.assets[idx] = {
      ...db.assets[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDatabase(db);
    return db.assets[idx];
  },

  delete: (id: string): boolean => {
    const db = readDatabase();
    const initLen = db.assets.length;
    db.assets = db.assets.filter((a) => a.id !== id);
    if (db.assets.length !== initLen) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// ------------------------------------------------------------------------------
// DOCUMENTS
// ------------------------------------------------------------------------------
export const dbDocuments = {
  getAll: (assetId?: string): Document[] => {
    const docs = readDatabase().documents;
    if (assetId) {
      return docs.filter((d) => d.asset_id === assetId);
    }
    return docs;
  },

  getById: (id: string): Document | undefined => {
    return readDatabase().documents.find((d) => d.id === id);
  },

  findByHash: (hash: string): Document | undefined => {
    return readDatabase().documents.find((d) => d.file_hash === hash);
  },

  create: (doc: Document): Document => {
    const db = readDatabase();
    db.documents.push(doc);
    writeDatabase(db);
    return doc;
  },

  update: (id: string, updates: Partial<Document>): Document | null => {
    const db = readDatabase();
    const idx = db.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    db.documents[idx] = { ...db.documents[idx], ...updates };
    writeDatabase(db);
    return db.documents[idx];
  },

  delete: (id: string): boolean => {
    const db = readDatabase();
    const initLen = db.documents.length;
    db.documents = db.documents.filter((d) => d.id !== id);
    if (db.documents.length !== initLen) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// ------------------------------------------------------------------------------
// OCR RECORDS
// ------------------------------------------------------------------------------
export const dbOCRRecords = {
  getAll: (): OCRRecord[] => {
    return readDatabase().ocr_records;
  },

  getById: (id: string): OCRRecord | undefined => {
    return readDatabase().ocr_records.find((r) => r.id === id);
  },

  getByDocumentId: (documentId: string): OCRRecord | undefined => {
    return readDatabase().ocr_records.find((r) => r.document_id === documentId);
  },

  create: (record: OCRRecord): OCRRecord => {
    const db = readDatabase();
    db.ocr_records.push(record);
    writeDatabase(db);
    return record;
  },

  update: (id: string, updates: Partial<OCRRecord>): OCRRecord | null => {
    const db = readDatabase();
    const idx = db.ocr_records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    db.ocr_records[idx] = { ...db.ocr_records[idx], ...updates };
    writeDatabase(db);
    return db.ocr_records[idx];
  },
};

// ------------------------------------------------------------------------------
// SERVICE & REPAIR RECORDS
// ------------------------------------------------------------------------------
export const dbServiceRecords = {
  getAll: (filter?: { assetId?: string; component?: string; search?: string }): ServiceRecord[] => {
    let records = readDatabase().service_records;

    if (filter?.assetId) {
      records = records.filter((r) => r.asset_id === filter.assetId);
    }

    if (filter?.component) {
      const comp = filter.component.toLowerCase();
      records = records.filter((r) => r.component.toLowerCase().includes(comp));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.component.toLowerCase().includes(q) ||
          r.vendor_name.toLowerCase().includes(q) ||
          r.description_of_work.toLowerCase().includes(q) ||
          (r.invoice_number && r.invoice_number.toLowerCase().includes(q))
      );
    }

    // Sort chronologically descending (newest first)
    return records.sort(
      (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
    );
  },

  getById: (id: string): ServiceRecord | undefined => {
    return readDatabase().service_records.find((r) => r.id === id);
  },

  create: (record: ServiceRecord): ServiceRecord => {
    const db = readDatabase();
    db.service_records.push(record);
    writeDatabase(db);
    return record;
  },

  update: (id: string, updates: Partial<ServiceRecord>): ServiceRecord | null => {
    const db = readDatabase();
    const idx = db.service_records.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    db.service_records[idx] = {
      ...db.service_records[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDatabase(db);
    return db.service_records[idx];
  },

  delete: (id: string): boolean => {
    const db = readDatabase();
    const initLen = db.service_records.length;
    db.service_records = db.service_records.filter((r) => r.id !== id);
    if (db.service_records.length !== initLen) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// ------------------------------------------------------------------------------
// WARRANTIES
// ------------------------------------------------------------------------------
export const dbWarranties = {
  getAll: (assetId?: string): Warranty[] => {
    const warranties = readDatabase().warranties;
    if (assetId) {
      return warranties.filter((w) => w.asset_id === assetId);
    }
    return warranties;
  },

  getById: (id: string): Warranty | undefined => {
    return readDatabase().warranties.find((w) => w.id === id);
  },

  getActiveForComponent: (assetId: string, component: string): Warranty[] => {
    const today = new Date().toISOString().split('T')[0];
    const compLower = component.toLowerCase().trim();
    return readDatabase().warranties.filter(
      (w) =>
        w.asset_id === assetId &&
        w.claim_status === 'active' &&
        w.expiry_date >= today &&
        (w.component.toLowerCase().includes(compLower) ||
          compLower.includes(w.component.toLowerCase()))
    );
  },

  create: (warranty: Warranty): Warranty => {
    const db = readDatabase();
    db.warranties.push(warranty);
    writeDatabase(db);
    return warranty;
  },

  update: (id: string, updates: Partial<Warranty>): Warranty | null => {
    const db = readDatabase();
    const idx = db.warranties.findIndex((w) => w.id === id);
    if (idx === -1) return null;

    db.warranties[idx] = {
      ...db.warranties[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDatabase(db);
    return db.warranties[idx];
  },
};

// ------------------------------------------------------------------------------
// REMINDERS
// ------------------------------------------------------------------------------
export const dbReminders = {
  getAll: (filter?: { assetId?: string; userId?: string }): Reminder[] => {
    let reminders = readDatabase().reminders;
    if (filter?.assetId) {
      reminders = reminders.filter((r) => r.asset_id === filter.assetId);
    }
    if (filter?.userId) {
      reminders = reminders.filter((r) => r.user_id === filter.userId);
    }
    return reminders.sort(
      (a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime()
    );
  },

  getById: (id: string): Reminder | undefined => {
    return readDatabase().reminders.find((r) => r.id === id);
  },

  create: (reminder: Reminder): Reminder => {
    const db = readDatabase();
    db.reminders.push(reminder);
    writeDatabase(db);
    return reminder;
  },

  update: (id: string, updates: Partial<Reminder>): Reminder | null => {
    const db = readDatabase();
    const idx = db.reminders.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    db.reminders[idx] = {
      ...db.reminders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDatabase(db);
    return db.reminders[idx];
  },

  delete: (id: string): boolean => {
    const db = readDatabase();
    const initLen = db.reminders.length;
    db.reminders = db.reminders.filter((r) => r.id !== id);
    if (db.reminders.length !== initLen) {
      writeDatabase(db);
      return true;
    }
    return false;
  },

  markComplete: (id: string, completedDate: string, invoiceLinkedId?: string): Reminder | null => {
    const db = readDatabase();
    const reminder = db.reminders.find((r) => r.id === id);
    if (!reminder) return null;

    // Log completion
    const log: ReminderLog = {
      id: `remlog-${Date.now()}`,
      reminder_id: id,
      triggered_date: reminder.next_due_date,
      status: 'completed',
      completed_date: completedDate,
      invoice_linked_id: invoiceLinkedId,
      created_at: new Date().toISOString(),
    };
    db.reminder_logs.push(log);

    // Compute next due date if repeat is enabled
    if (reminder.repeat_enabled) {
      const baseDate = new Date(completedDate || reminder.next_due_date);
      let monthsToAdd = 6;
      if (reminder.frequency === 'monthly') monthsToAdd = 1;
      else if (reminder.frequency === 'every_3_months') monthsToAdd = 3;
      else if (reminder.frequency === 'every_6_months') monthsToAdd = 6;
      else if (reminder.frequency === 'annually') monthsToAdd = 12;

      baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
      reminder.reference_date = completedDate;
      reminder.next_due_date = baseDate.toISOString().split('T')[0];
    } else {
      reminder.is_active = false;
    }

    reminder.updated_at = new Date().toISOString();
    writeDatabase(db);
    return reminder;
  },
};

// ------------------------------------------------------------------------------
// AUDIT LOGS
// ------------------------------------------------------------------------------
export const dbAuditLogs = {
  getAll: (): AuditLog[] => {
    return readDatabase().audit_logs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  create: (log: AuditLog): AuditLog => {
    const db = readDatabase();
    db.audit_logs.push(log);
    writeDatabase(db);
    return log;
  },
};

// ------------------------------------------------------------------------------
// SYSTEM STATS & EXPENSE ANALYTICS
// ------------------------------------------------------------------------------
export const dbStats = {
  getSystemStats: (): SystemStats => {
    const db = readDatabase();
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const purchaseExpense = db.assets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0);
    const repairExpense = db.service_records
      .filter((s) => s.service_type === 'repair')
      .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const serviceExpense = db.service_records
      .filter((s) => s.service_type !== 'repair')
      .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    const activeWarranties = db.warranties.filter(
      (w) => w.claim_status === 'active' && w.expiry_date >= today
    );
    const expiringWarranties = db.warranties.filter(
      (w) =>
        w.claim_status === 'active' &&
        w.expiry_date >= today &&
        w.expiry_date <= thirtyDaysAhead
    );

    const upcomingReminders = db.reminders.filter(
      (r) => r.is_active && r.next_due_date >= today
    );
    const overdueReminders = db.reminders.filter(
      (r) => r.is_active && r.next_due_date < today
    );

    const storageBytesUsed = db.documents.reduce((sum, d) => sum + (Number(d.file_size) || 0), 0);

    return {
      totalUsers: db.users.length,
      totalAssets: db.assets.length,
      totalDocuments: db.documents.length,
      totalPurchaseExpense: purchaseExpense,
      totalRepairExpense: repairExpense,
      totalServiceExpense: serviceExpense,
      upcomingRemindersCount: upcomingReminders.length,
      overdueRemindersCount: overdueReminders.length,
      activeWarrantiesCount: activeWarranties.length,
      expiringWarrantiesCount: expiringWarranties.length,
      storageBytesUsed,
    };
  },

  getExpenseAnalytics: () => {
    const db = readDatabase();

    // 1. Monthly Spending (past 12 months)
    const monthlyMap: Record<string, { repair: number; service: number; total: number }> = {};
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    db.service_records.forEach((s) => {
      const date = new Date(s.service_date);
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { repair: 0, service: 0, total: 0 };
      }
      const amt = Number(s.total_amount) || 0;
      if (s.service_type === 'repair') {
        monthlyMap[key].repair += amt;
      } else {
        monthlyMap[key].service += amt;
      }
      monthlyMap[key].total += amt;
    });

    const monthlyTrends = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      repair: data.repair,
      service: data.service,
      total: data.total,
    }));

    // 2. Category-wise Spending
    const categoryMap: Record<string, number> = {};
    db.service_records.forEach((s) => {
      const asset = db.assets.find((a) => a.id === s.asset_id);
      const cat = asset?.category_name || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(s.total_amount) || 0);
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. Asset-wise Lifetime Maintenance Cost
    const assetCosts = db.assets.map((a) => {
      const totalMaintenance = db.service_records
        .filter((s) => s.asset_id === a.id)
        .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

      const serviceCount = db.service_records.filter((s) => s.asset_id === a.id).length;

      return {
        id: a.id,
        name: a.name,
        brand: a.brand,
        category: a.category_name || 'Asset',
        purchasePrice: Number(a.purchase_price) || 0,
        totalMaintenance,
        serviceCount,
        totalCostOfOwnership: (Number(a.purchase_price) || 0) + totalMaintenance,
      };
    });

    // 4. Vendor-wise Spending
    const vendorMap: Record<string, number> = {};
    db.service_records.forEach((s) => {
      vendorMap[s.vendor_name] = (vendorMap[s.vendor_name] || 0) + (Number(s.total_amount) || 0);
    });
    const vendorBreakdown = Object.entries(vendorMap)
      .map(([vendor, total]) => ({ vendor, total }))
      .sort((a, b) => b.total - a.total);

    return {
      monthlyTrends,
      categoryBreakdown,
      assetCosts,
      vendorBreakdown,
    };
  },
};
