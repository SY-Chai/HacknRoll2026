import { supabase } from './server/app/utils/supabase.js';

async function inspectSchema() {
    console.log('Inspecting Supabase Schema...');

    // Try to list tables via an unconventional way since we don't have RPC
    // We'll try to guess some tables or check the information_schema if allowed
    const tablesToTry = [
        'journeys', 'Journeys', 'archival_records', 'Archival_Records',
        'user_media', 'User_Media', 'journal', 'Journal',
        'record', 'Record', 'memories', 'Memories',
        'posts', 'Posts', 'uploads', 'Uploads',
        'media', 'Media', 'data', 'Data'
    ];

    console.log('Brute-forcing table names...');
    for (const table of tablesToTry) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
            console.log(`Table "${table}": FOUND and ACCESSIBLE!`);
        } else if (!error.message.includes('Could not find the table')) {
            console.log(`Table "${table}": FOUND but BLOCKED/ERROR (${error.message})`);
        }
    }
}

inspectSchema();
