const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname,'.env') });

const cloudUri = process.env.MONGO_URI;
const localUri = 'mongodb://127.0.0.1:27017/expense-tracker';

async function testConnection(name,uri) {
    if (!uri) {
        console.log(`[${name}] Skipped: No URI`);
        return false;
    }
    console.log(`Testing ${name}: ${uri.split('@')[1] || uri}...`);
    try {
        const conn = await mongoose.createConnection(uri,{
            serverSelectionTimeoutMS: 5000,
            family: 4
        }).asPromise();
        console.log(`✅ ${name} Connected Successfully!`);
        await conn.close();
        return true;
    } catch (err) {
        console.log(`❌ ${name} Failed: ${err.message}`);
        return false;
    }
}

async function run() {
    console.log("--- Starting Database Diagnostics ---");
    const cloudWorks = await testConnection('Cloud Atlas',cloudUri);
    const localWorks = await testConnection('LocalDB',localUri);

    if (cloudWorks) {
        console.log("\nCONCLUSION: Cloud working. Restart server.");
    } else if (localWorks) {
        console.log("\nCONCLUSION: Local DB available. Switching recommended.");
        // We will output a specific string to let the agent know we can switch
        console.log("ACTION_RECOMMENDED: SWITCH_TO_LOCAL");
    } else {
        console.log("\nCONCLUSION: Both failed. Please check IP Whitelist for Cloud, or Install MongoDB for Local.");
    }
    process.exit(0);
}

run();
