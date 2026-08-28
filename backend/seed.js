require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const defaultCategories = [
  'Food', 'Rent', 'Transport', 'Shopping',
  'Entertainment', 'Utilities', 'Miscellaneous'
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const name of defaultCategories) {
    await Category.findOneAndUpdate(
      { name },
      { name, isDefault: true },
      { upsert: true } // create it if it doesn't exist, skip if it does
    );
  }

  console.log('Default categories seeded');
  mongoose.connection.close();
};

seed();