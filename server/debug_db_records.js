
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentRecords() {
    console.log("Checking recent Journal entries...");

    // Get latest journal
    const { data: journals, error: journalError } = await supabase
        .from('Journal')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (journalError) {
        console.error("Error fetching journals:", journalError);
        return;
    }

    if (journals.length === 0) {
        console.log("No journals found.");
        return;
    }

    console.log(`Found ${journals.length} recent journals.`);

    for (const journal of journals) {
        console.log(`\nJournal ID: ${journal.id}`);
        console.log(`Query: ${journal.query}`);
        console.log(`Created At: ${journal.created_at}`);

        // Get records for this journal
        const { data: records, error: recordError } = await supabase
            .from('Record')
            .select('*')
            .eq('journal_id', journal.id);

        if (recordError) {
            console.error("Error fetching records:", recordError);
            continue;
        }

        console.log(`Records count: ${records.length}`);
        records.forEach((r, i) => {
            console.log(`-- Record ${i + 1} --`);
            console.log(`   Title: ${r.title}`);
            console.log(`   Description: ${r.description ? r.description.substring(0, 50) + "..." : "NULL"}`);
            console.log(`   Image URL: ${r.image_url}`);
        });
    }
}

checkRecentRecords();
