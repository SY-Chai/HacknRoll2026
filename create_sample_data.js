import { supabase } from './server/app/utils/supabase.js';

async function createSampleData() {
    console.log('Inserting sample journey...');

    const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .insert([{
            search_query: 'Orchard Road',
            title: 'Journey to Orchard Road',
            date_range: '1970 - 1980'
        }])
        .select()
        .single();

    if (journeyError) {
        console.error('Error inserting journey:', journeyError.message);
        return;
    }

    console.log(`Sample journey created! ID: ${journey.id}`);

    console.log('Inserting sample archival records...');
    const { error: recordsError } = await supabase
        .from('archival_records')
        .insert([
            {
                journey_id: journey.id,
                title: 'Orchard Road Traffic',
                description: 'Bustling traffic on Orchard Road in the late 70s.',
                image_url: 'https://www.nas.gov.sg/archivesonline/data/photographs/thumbnails/19980005615-0066.jpg',
                source_url: 'https://www.nas.gov.sg/archivesonline/photographs/record-details/19980005615-0066',
                record_date: '1978',
                display_order: 1
            },
            {
                journey_id: journey.id,
                title: 'Shopping at CK Tang',
                description: 'Traditional architecture of the original CK Tang building.',
                image_url: 'https://www.nas.gov.sg/archivesonline/data/photographs/thumbnails/19980005615-0067.jpg',
                source_url: 'https://www.nas.gov.sg/archivesonline/photographs/record-details/19980005615-0067',
                record_date: '1975',
                display_order: 2
            }
        ]);

    if (recordsError) {
        console.error('Error inserting records:', recordsError.message);
    } else {
        console.log('Sample archival records inserted!');
    }

    console.log('Checking if data is there...');
    const { data: checkData, error: checkError } = await supabase
        .from('journeys')
        .select('*, archival_records(*)')
        .eq('id', journey.id)
        .single();

    if (checkError) {
        console.error('Error checking data:', checkError.message);
    } else {
        console.log('\n--- SUCCESS ---');
        console.log(`Found Journey: ${checkData.title}`);
        console.log(`Associated Records: ${checkData.archival_records.length}`);
        checkData.archival_records.forEach((r, i) => {
            console.log(`${i + 1}. ${r.title} (${r.record_date})`);
        });
    }
}

createSampleData();
