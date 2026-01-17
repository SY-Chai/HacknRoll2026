
import { supabase } from './app/config/supabase.js';

async function cleanBadRecords() {
    console.log("Cleaning records with invalid image URLs (starting with https://images/)...");

    // 1. Find IDs of records with bad URLs
    const { data: badRecords, error: searchError } = await supabase
        .from('Record')
        .select('id, journal_id, image_url')
        .ilike('image_url', 'https://images/%');

    if (searchError) {
        console.error("Error searching for bad records:", searchError);
        return;
    }

    if (!badRecords || badRecords.length === 0) {
        console.log("No bad records found.");
        return;
    }

    console.log(`Found ${badRecords.length} bad records. Deleting...`);

    const idsToDelete = badRecords.map(r => r.id);
    const journalIds = [...new Set(badRecords.map(r => r.journal_id))];

    // 2. Delete bad records
    const { error: deleteError } = await supabase
        .from('Record')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error("Error deleting records:", deleteError);
        return;
    }
    console.log("Deleted bad records.");

    // 3. (Optional) Delete empty journals? 
    // For now, let's just delete the journals associated with these bad records to force re-scraping.
    console.log(`Deleting ${journalIds.length} potentially affected journals to force re-scrape...`);
    const { error: journalDeleteError } = await supabase
        .from('Journal')
        .delete()
        .in('id', journalIds);

    if (journalDeleteError) {
        console.error("Error deleting journals:", journalDeleteError);
    } else {
        console.log("Deleted affected journals.");
    }
}

cleanBadRecords();
