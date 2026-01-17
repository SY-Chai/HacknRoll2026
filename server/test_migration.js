
import axios from 'axios';
import { supabase } from './app/config/supabase.js';

const PORT = 3000; // Assume server is running

async function testSearchFlow() {
    try {
        console.log("🔍 Testing Search -> Journal Creation...");
        
        // 1. Trigger Search
        const searchRes = await axios.post(`http://localhost:${PORT}/api/journal/search`, {
            query: "chinatown 1960"
        });

        console.log("Search Response:", searchRes.data);

        if (!searchRes.data.success || !searchRes.data.journalId) {
            throw new Error("Search API did not return journalId");
        }

        const journalId = searchRes.data.journalId;
        console.log(`✅ Journal Created: ${journalId}`);

        // 2. Fetch Journal from DB (Simulate Frontend Fetch)
        const fetchRes = await axios.get(`http://localhost:${PORT}/api/journal/${journalId}`);
        const journal = fetchRes.data;

        console.log("Fetch Response:", JSON.stringify(journal, null, 2));

        if (journal.id !== journalId) throw new Error("ID mismatch");
        if (journal.records.length === 0) throw new Error("No records found in journal");
        
        console.log("✅ Fetch Verified. Records:", journal.records.length);

        // 3. Clean up (Optional)
        // await supabase.from('records').delete().eq('journal_id', journalId);
        // await supabase.from('journal').delete().eq('id', journalId);

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
}

testSearchFlow();
