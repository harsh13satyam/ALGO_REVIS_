const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Drop old phone index if present
  try {
    await mongoose.connection.db.collection('users').dropIndex('phone_1');
    console.log('Dropped old phone_1 index');
  } catch (err) {
    console.log('Index drop notice:', err.message);
  }

  // 2. Unset phone: null so null values don't exist
  const res = await mongoose.connection.db.collection('users').updateMany(
    { phone: null },
    { $unset: { phone: '' } }
  );
  console.log('Unset phone: null on', res.modifiedCount, 'users');

  // 3. Create partial unique index
  await mongoose.connection.db.collection('users').createIndex(
    { phone: 1 },
    {
      unique: true,
      partialFilterExpression: { phone: { $type: 'string' } }
    }
  );
  console.log('Created partial unique index on phone successfully');

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
