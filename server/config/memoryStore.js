const crypto = require('crypto');

function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

// In-memory collections
const collections = {
  users: [],
  auctions: [],
  bids: []
};

// Helper: match document against MongoDB query filter
function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, val] of Object.entries(filter)) {
    const docVal = doc[key];

    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      // Comparison operators: $lt, $gt, $lte, $gte, $ne, $in
      for (const [op, opVal] of Object.entries(val)) {
        if (op === '$lt') {
          const compA = docVal instanceof Date ? docVal.getTime() : docVal;
          const compB = opVal instanceof Date ? opVal.getTime() : opVal;
          if (!(compA < compB)) return false;
        } else if (op === '$lte') {
          const compA = docVal instanceof Date ? docVal.getTime() : docVal;
          const compB = opVal instanceof Date ? opVal.getTime() : opVal;
          if (!(compA <= compB)) return false;
        } else if (op === '$gt') {
          const compA = docVal instanceof Date ? docVal.getTime() : docVal;
          const compB = opVal instanceof Date ? opVal.getTime() : opVal;
          if (!(compA > compB)) return false;
        } else if (op === '$gte') {
          const compA = docVal instanceof Date ? docVal.getTime() : docVal;
          const compB = opVal instanceof Date ? opVal.getTime() : opVal;
          if (!(compA >= compB)) return false;
        } else if (op === '$ne') {
          if (docVal === opVal) return false;
        } else if (op === '$in') {
          if (!Array.isArray(opVal) || !opVal.includes(docVal)) return false;
        }
      }
    } else {
      // Direct comparison (handling ObjectId strings / objects)
      const a = (docVal && docVal._id) ? docVal._id.toString() : (docVal ? docVal.toString() : docVal);
      const b = (val && val._id) ? val._id.toString() : (val ? val.toString() : val);
      if (a !== b) return false;
    }
  }
  return true;
}

// Helper: populate refs
function populateDoc(doc, field, select = '') {
  if (!doc) return doc;
  const clone = { ...doc };
  const val = clone[field];
  if (!val) return clone;

  const idToFind = typeof val === 'object' && val._id ? val._id.toString() : val.toString();

  // Look in users collection
  const foundUser = collections.users.find(u => u._id.toString() === idToFind);
  if (foundUser) {
    if (select) {
      const fields = select.split(/\s+/).filter(Boolean);
      const selected = { _id: foundUser._id };
      fields.forEach(f => {
        if (foundUser[f] !== undefined) selected[f] = foundUser[f];
      });
      clone[field] = selected;
    } else {
      const { password, ...safeUser } = foundUser;
      clone[field] = safeUser;
    }
  }
  return clone;
}

class QueryChain {
  constructor(results, populateFn) {
    this.results = results;
    this.populateFn = populateFn;
    this.populateList = [];
  }

  populate(field, select = '') {
    this.populateList.push({ field, select });
    return this;
  }

  sort(sortOptions) {
    if (sortOptions && typeof sortOptions === 'object') {
      const [field, dir] = Object.entries(sortOptions)[0] || [];
      if (field) {
        this.results.sort((a, b) => {
          let valA = a[field];
          let valB = b[field];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (valA < valB) return dir === -1 || dir === 'desc' ? 1 : -1;
          if (valA > valB) return dir === -1 || dir === 'desc' ? -1 : 1;
          return 0;
        });
      }
    }
    return this;
  }

  limit(num) {
    if (num > 0) {
      this.results = this.results.slice(0, num);
    }
    return this;
  }

  async then(resolve, reject) {
    let finalResults = this.results;
    if (this.populateList.length > 0) {
      if (Array.isArray(finalResults)) {
        finalResults = finalResults.map(item => {
          let populated = item;
          for (const pop of this.populateList) {
            populated = populateDoc(populated, pop.field, pop.select);
          }
          return populated;
        });
      } else if (finalResults) {
        for (const pop of this.populateList) {
          finalResults = populateDoc(finalResults, pop.field, pop.select);
        }
      }
    }
    return resolve(finalResults);
  }
}

// Memory Model Factory
function createMemoryModel(collectionName) {
  const coll = collections[collectionName];

  return {
    async create(doc) {
      const newDoc = {
        _id: doc._id || generateObjectId(),
        ...doc,
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date()
      };
      coll.push(newDoc);
      return { ...newDoc };
    },

    find(filter = {}) {
      const matched = coll.filter(item => matchesFilter(item, filter)).map(item => ({ ...item }));
      return new QueryChain(matched);
    },

    findOne(filter = {}) {
      const found = coll.find(item => matchesFilter(item, filter));
      return new QueryChain(found ? { ...found } : null);
    },

    findById(id) {
      const found = coll.find(item => item._id.toString() === (id ? id.toString() : ''));
      return new QueryChain(found ? { ...found } : null);
    },

    async countDocuments(filter = {}) {
      return coll.filter(item => matchesFilter(item, filter)).length;
    },

    async deleteOne(filter = {}) {
      const idx = coll.findIndex(item => matchesFilter(item, filter));
      if (idx !== -1) {
        coll.splice(idx, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },

    async findByIdAndDelete(id) {
      const idx = coll.findIndex(item => item._id.toString() === (id ? id.toString() : ''));
      if (idx !== -1) {
        const removed = coll.splice(idx, 1)[0];
        return { ...removed };
      }
      return null;
    },

    // Atomic update implementation (e.g. findOneAndUpdate with $set, $inc, condition guards)
    findOneAndUpdate(filter, update, options = {}) {
      const idx = coll.findIndex(item => matchesFilter(item, filter));
      if (idx === -1) {
        return new QueryChain(null);
      }

      const current = coll[idx];
      const updated = { ...current };

      if (update.$set) {
        for (const [k, v] of Object.entries(update.$set)) {
          updated[k] = v;
        }
      }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          updated[k] = (updated[k] || 0) + v;
        }
      }
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) {
          updated[k] = v;
        }
      }
      updated.updatedAt = new Date();

      coll[idx] = updated;
      const res = options.new ? { ...updated } : { ...current };
      return new QueryChain(res);
    },

    async clear() {
      coll.length = 0;
    }
  };
}

module.exports = {
  collections,
  createMemoryModel,
  generateObjectId
};
