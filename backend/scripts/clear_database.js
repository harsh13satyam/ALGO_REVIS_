require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

async function clearWholeDatabase() {
  console.log('\n======================================================');
  console.log('🧹 CLEARING ENTIRE ALGOREVIS DATABASE');
  console.log('======================================================\n');

  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise(r => setTimeout(r, 200));
  }

  const collections = await mongoose.connection.db.collections();
  console.log(`Found ${collections.length} collection(s) in database.\n`);

  for (const collection of collections) {
    const colName = collection.collectionName;
    const countBefore = await collection.countDocuments();
    const result = await collection.deleteMany({});
    console.log(`- Cleared "${colName}": deleted ${result.deletedCount} document(s) (was ${countBefore})`);
  }

  console.log('\n======================================================');
  console.log('✨ DATABASE EMPTIED SUCCESSFULLY! READY FOR FRESH START');
  console.log('======================================================\n');
  process.exit(0);
}

clearWholeDatabase().catch(err => {
  console.error('\n❌ Error clearing database:', err);
  process.exit(1);
});
