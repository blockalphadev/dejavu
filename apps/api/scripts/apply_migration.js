const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    // Hardcoded connection string from .env (URL encoded password)
    // Using K27f3786137% directly (pg handles it if passed as string? No, connectionString needs encoding or object)
    // Let's use object config to be safe
    const client = new Client({
        host: 'db.meeyiimlnsboyhvvycaz.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'K27f3786137%', // Raw password
        database: 'postgres',
        ssl: { rejectUnauthorized: false } // Supabase usually needs SSL
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, '../supabase/migrations/018_update_data_sources.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
