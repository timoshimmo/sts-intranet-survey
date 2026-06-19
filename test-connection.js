require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to MongoDB Atlas...');
console.log('Host: cluster0.infl4ef.mongodb.net');
console.log('Database: stac_survey');
console.log('User: tokmangwang_db_user');
console.log('---');

mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log('✅ Connected successfully!');
    console.log('   Server:', mongoose.connection.host);
    console.log('   DB:', mongoose.connection.name);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('\nThings to check:');
    console.log('  1. Network Access in Atlas → is 0.0.0.0/0 status "Active" (not pending)?');
    console.log('  2. Database Access → is tokmangwang_db_user enabled with readWriteAnyDatabase?');
    console.log('  3. Cluster → is it fully provisioned (not paused)?');
    process.exit(1);
  });
