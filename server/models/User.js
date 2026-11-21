const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isMemory } = require('../config/db');
const { createMemoryModel } = require('../config/memoryStore');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    balance: {
      type: Number,
      default: 50000, // Starting simulated wallet balance
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);
const MemoryUser = createMemoryModel('users');

const User = {
  async create(data) {
    if (isMemory()) {
      if (data.password && !data.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
      }
      return await MemoryUser.create(data);
    }
    return await MongooseUser.create(data);
  },

  findOne(filter) {
    if (isMemory()) return MemoryUser.findOne(filter);
    return MongooseUser.findOne(filter);
  },

  findById(id) {
    if (isMemory()) return MemoryUser.findById(id);
    return MongooseUser.findById(id);
  },

  find(filter) {
    if (isMemory()) return MemoryUser.find(filter);
    return MongooseUser.find(filter);
  },

  countDocuments(filter) {
    if (isMemory()) return MemoryUser.countDocuments(filter);
    return MongooseUser.countDocuments(filter);
  },

  findOneAndUpdate(filter, update, options) {
    if (isMemory()) return MemoryUser.findOneAndUpdate(filter, update, options);
    return MongooseUser.findOneAndUpdate(filter, update, options);
  },

  async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  },

  schema: userSchema,
  mongooseModel: MongooseUser,
};

module.exports = User;
