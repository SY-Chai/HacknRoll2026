
import axios from 'axios';
import { supabase } from './server/app/config/supabase.js';

// Setup Mock Environment if needed, or just hit localhost
const API_URL = 'http://localhost:3000';

async function test() {
    console.log("1. Fetching a real journal ID from DB...");
    const { data: journals, error } = await supabase
        .from('Journal')
        .select('*')
        .limit(1);

    if (error || !journals || journals.length === 0) {
        console.error("No journals found in DB to test with. Create one first.");
        return;
    }

    const testId = journals[0].id;
    console.log(`Found Journal ID: ${testId}`);

    console.log("2. Testing /api/journal/batch with this ID...");
    try {
        const response = await axios.post(`${API_URL}/api/journal/batch`, {
            ids: [testId]
        });

        console.log("Status:", response.status);
        console.log("Data:", JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.data.length === 1) {
            console.log("SUCCESS: Batch endpoint returned the journal.");
        } else {
            console.error("FAILURE: Batch endpoint did not return the expected journal.");
        }

    } catch (err) {
        console.error("Request Failed:", err.message);
        if (err.response) {
            console.error("Response:", err.response.data);
        }
    }
}

test();
