const bcrypt = require('bcryptjs');

// Simple in-memory storage for demo mode
// 🔹 BLANK SLATE: All business data removed for clean startup
const storage = {
  users: [
    {
       _id: 'seed-user-1',
       name: 'Test Administrator',
       email: 'test@example.com',
       password: 'password123',
       createdAt: new Date(),
       settings: { 
           emailReminders: true,
           defaultCurrency: 'INR',
           reminderSettings: {
               upcomingDays: 1,
               followUpDays: 2,
               overdueDays: 5
           }
       }
    }
  ],
  clients: [], // Purged per user request
  invoices: [], // Purged per user request
  payments: [], // Purged per user request
  agreements: [],
  templates: []
};

// Helper for deep population
const populateField = (item, field, sourceCollection) => {
  const sourceIdValue = item[field];
  if (sourceIdValue && typeof sourceIdValue === 'object' && sourceIdValue._id) return;
  
  const sourceId = String(sourceIdValue);
  if (sourceId && sourceId !== 'undefined' && sourceId !== 'null') {
    const found = storage[sourceCollection].find(s => String(s._id) === sourceId);
    if (found) {
        item[field] = JSON.parse(JSON.stringify(found));
        if (field === 'invoiceId' && item[field].clientId) populateField(item[field], 'clientId', 'clients');
    } else {
        item[field] = null;
    }
  }
};

// Generic Mock Model Class
class MockModel {
  constructor(collection, data) {
    Object.assign(this, data);
    this._collection = collection;
    this._id = data._id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save() {
    this.updatedAt = new Date();
    
    // 🔹 DATA INTEGRITY GUARD: Prevent blank records
    if (!this.name && ['users', 'clients'].includes(this._collection)) {
        throw new Error(`Data Integrity Error: Name is required for collection ${this._collection}`);
    }
    if (!this.userId && this._collection !== 'users') {
        throw new Error(`Data Integrity Error: User ID is required for collection ${this._collection}`);
    }

    if (this._collection === 'users' && this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    const saveData = { ...this };
    for (const key in saveData) {
        if (saveData[key] && typeof saveData[key] === 'object' && saveData[key]._id && key !== '_id') {
            saveData[key] = String(saveData[key]._id);
        } else if (['clientId', 'invoiceId', 'userId'].includes(key) && saveData[key]) {
            saveData[key] = String(saveData[key]);
        }
    }
    delete saveData._collection;
    delete saveData.save;

    const index = storage[this._collection].findIndex(u => String(u._id) === String(this._id));
    if (index >= 0) {
      storage[this._collection][index] = saveData;
    } else {
      storage[this._collection].push(saveData);
    }

    repairStorage();
    return this;
  }
}

// User-specific mock
class MockUser extends MockModel {
  constructor(data) {
    super('users', data);
    if (!this.settings) this.settings = { emailReminders: true, defaultCurrency: 'INR' };
    if (!this.settings.defaultCurrency) this.settings.defaultCurrency = 'INR';
  }
  async comparePassword(candidate) {
    if (!this.password) return false;
    if (!this.password.startsWith('$2')) return candidate === this.password;
    try {
      return await bcrypt.compare(candidate, this.password);
    } catch (e) {
      return candidate === this.password;
    }
  }
  static async findOne(query) {
    const u = storage.users.find(u => u.email === query.email);
    return u ? new MockUser(u) : null;
  }
  static async findById(id) {
    const u = storage.users.find(u => u._id === id);
    return u ? new MockUser(u) : null;
  }
  static async create(data) {
    const user = new MockUser(data);
    await user.save();
    return user;
  }
}

// Chainable query helper
const createQuery = (data) => {
  let results = JSON.parse(JSON.stringify(data));
  const promise = Promise.resolve(results);
  promise.sort = (sortObj) => {
    const field = Object.keys(sortObj)[0];
    const order = sortObj[field] || 1;
    results.sort((a, b) => (a[field] < b[field] ? -1 * order : a[field] > b[field] ? 1 * order : 0));
    return promise;
  };
  promise.limit = (n) => { results.splice(n); return promise; };
  promise.populate = (fields) => {
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    results.forEach(item => {
      fieldsArray.forEach(f => {
          const path = typeof f === 'string' ? f : f.path;
          if (path === 'clientId') populateField(item, 'clientId', 'clients');
          if (path === 'invoiceId') populateField(item, 'invoiceId', 'invoices');
          if (path === 'userId') populateField(item, 'userId', 'users');
      });
    });
    return promise;
  };
  return promise;
};

const createDocQuery = (data, collection) => {
    let populateFields = [];
    const execute = () => {
        let results = JSON.parse(JSON.stringify(data));
        results.forEach(item => {
            populateFields.forEach(field => {
                if (field === 'clientId') populateField(item, 'clientId', 'clients');
                if (field === 'invoiceId') populateField(item, 'invoiceId', 'invoices');
                if (field === 'userId') populateField(item, 'userId', 'users');
            });
        });
        if (!results || results.length === 0) return Promise.resolve(null);
        return Promise.resolve(new MockModel(collection, results[0]));
    };
    const docPromise = Promise.resolve().then(() => execute());
    docPromise.populate = (fields) => {
        const fieldsArray = typeof fields === 'string' ? [fields] : (fields.path ? [fields.path] : fields);
        populateFields = [...populateFields, ...fieldsArray];
        return docPromise.then(() => execute());
    };
    return docPromise;
};

const filterData = (collection, query) => {
  return storage[collection].filter(item => {
    for (const key in query) {
      const val = query[key];
      if (val && typeof val === 'object' && val.$ne !== undefined) {
        if (String(item[key]) === String(val.$ne)) return false;
        continue;
      }
      if (val && typeof val === 'object' && (val.$gte !== undefined || val.$lte !== undefined)) {
        const itemVal = item[key] instanceof Date ? item[key] : new Date(item[key]);
        if (val.$gte !== undefined && itemVal < new Date(val.$gte)) return false;
        if (val.$lte !== undefined && itemVal > new Date(val.$lte)) return false;
        continue;
      }
      if (val && typeof val === 'object' && val.$in) {
        if (!val.$in.map(String).includes(String(item[key]))) return false;
        continue;
      }
      if (String(item[key]) !== String(val)) return false;
    }
    return true;
  });
};

const mockDb = {
  User: MockUser,
  Client: class extends MockModel {
    constructor(data) { super('clients', data); this.budget = Number(data.budget) || 0; }
    static find(query) { return createQuery(filterData('clients', query)); }
    static findById(id) { return createDocQuery(storage.clients.filter(item => String(item._id) === String(id)), 'clients'); }
    static async create(data) { const c = new mockDb.Client(data); await c.save(); return c; }
  },
  Invoice: class extends MockModel {
    constructor(data) { 
        super('invoices', data); 
        this.paidAmount = Number(data.paidAmount) || 0;
        this.totalAmount = Number(data.totalAmount) || 0;
        this.currency = data.currency || 'INR'; // 🔹 MULTI-CURRENCY SUPPORT
    }
    static find(query) { return createQuery(filterData('invoices', query)); }
    static findById(id) { return createDocQuery(storage.invoices.filter(item => String(item._id) === String(id)), 'invoices'); }
    static async create(data) { const i = new mockDb.Invoice(data); await i.save(); return i; }
  },
  Agreement: class extends MockModel {
    constructor(data) { super('agreements', data); }
    static find(query) { return createQuery(filterData('agreements', query)); }
    static findById(id) { return createDocQuery(storage.agreements.filter(item => String(item._id) === String(id)), 'agreements'); }
    static async create(data) { const a = new mockDb.Agreement(data); await a.save(); return a; }
  },
  Template: class extends MockModel {
    constructor(data) { super('templates', data); }
    static find(query) { return createQuery(storage.templates.filter(t => !query.userId || t.userId === query.userId)); }
    static async create(data) { const t = new mockDb.Template(data); await t.save(); return t; }
  },
  Payment: class extends MockModel {
    constructor(data) { 
        super('payments', data); 
        this.amount = Number(data.amount) || 0;
        this.method = data.method || 'Manual';
    }
    static find(query) { return createQuery(filterData('payments', query)); }
    static async create(data) { const p = new mockDb.Payment(data); await p.save(); return p; }
  }
};

mockDb.User = function(data) { return new MockUser(data); };
mockDb.User.findOne = MockUser.findOne;
mockDb.User.findById = MockUser.findById;
mockDb.User.create = MockUser.create;

const repairStorage = () => {
    storage.invoices.forEach(invoice => {
        const invId = String(invoice._id);
        const relatedPayments = storage.payments.filter(p => String(p.invoiceId) === invId);
        invoice.paidAmount = relatedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        invoice.totalAmount = Number(invoice.totalAmount) || 0;
        if (invoice.paidAmount >= invoice.totalAmount - 0.01 && invoice.totalAmount > 0) {
            invoice.status = 'paid';
        } else if (invoice.paidAmount > 0) {
            invoice.status = 'partial';
        }
    });
};

repairStorage();
mockDb._debug_storage = storage;
module.exports = mockDb;
