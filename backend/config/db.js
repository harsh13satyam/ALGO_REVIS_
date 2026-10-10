const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for resolving MongoDB Atlas SRV/TXT records on Windows/ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('⚠️ [Database] MONGO_URI is not defined in environment variables.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ [Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ [Database] Connection failed:', error.message);
    if (error.message.includes('querySrv ENOTFOUND') || error.message.includes('queryTxt EREFUSED')) {
      console.warn('💡 [Database] Tip: The MongoDB Atlas host could not be resolved by DNS. Check your cluster hostname or local DNS.');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.warn('💡 [Database] Tip: Authentication failed. Verify username and password.');
    } else if (error.message.includes('IP that isn\'t whitelisted') || error.name === 'MongooseServerSelectionError') {
      console.warn('💡 [Database] Tip: Ensure your current IP is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0 for anywhere).');
    }
    return false;
  }
};

const getDBStatus = () => {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null
  };
};

module.exports = { connectDB, getDBStatus };
