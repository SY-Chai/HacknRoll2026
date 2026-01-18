
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBadJournals() {
    console.log("Cleaning bad journals...");

    // Find journals with bad records (image_url starts with https://images/ OR description is NULL)
    // Actually, easier to just delete the recently created ones that match this criteria.

    const { data: records, error } = await supabase
        .from('Record')
        .select('journal_id')
        .or('image_url.like.https://images/%,description.is.null')
        .limit(100);

    if (error) {
        console.error("Error finding bad records:", error);
        return;
    }

    if (!records || records.length === 0) {
        console.log("No bad records found to clean.");
        return;
    }

    const journalIds = [...new Set(records.map(r => r.journal_id))];
    console.log(`Found ${journalIds.length} journals with bad records. Deleting records first...`);

    const { error: deleteRecordsError } = await supabase
        .from('Record')
        .delete()
        .in('journal_id', journalIds);

    if (deleteRecordsError) {
        console.error("Error deleting records:", deleteRecordsError);
        return;
    }

    console.log("Records deleted. Now deleting Journals...");

    const { error: deleteError } = await supabase
        .from('Journal')
        .delete()
        .in('id', journalIds);

    if (deleteError) {
        console.error("Error deleting journals:", deleteError);
    } else {
        console.log(`Successfully deleted ${journalIds.length} bad journals.`);
    }
}

cleanBadJournals();
