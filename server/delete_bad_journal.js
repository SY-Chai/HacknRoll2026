
import { supabase } from './app/config/supabase.js';

const JOURNAL_ID = 45;

async function deleteJournal() {
    console.log(`Deleting Journal ID: ${JOURNAL_ID}...`);

    // Delete Records first (foreign key constraint)
    const { error: recordError } = await supabase
        .from('Record')
        .delete()
        .eq('journal_id', JOURNAL_ID);

    if (recordError) {
        console.error("Error deleting records:", recordError);
        return;
    }
    console.log("Deleted associated records.");

    // Delete Journal
    const { error: journalError } = await supabase
        .from('Journal')
        .delete()
        .eq('id', JOURNAL_ID);

    if (journalError) {
        console.error("Error deleting journal:", journalError);
        return;
    }

    console.log("Successfully deleted Journal ID", JOURNAL_ID);
}

deleteJournal();
