-- 4. Seed data for new Journal and Record tables
INSERT INTO journal (query, title, description, image_url, audio_url, user_creeated)
VALUES (
    'Grandma''s Stories',
    'Old Chinatown Memories',
    'My grandmother used to tell me about how she lived in a shophouse in Chinatown during the 1960s. The streets were always filled with the smell of roasting coffee and the sound of Cantonese opera.',
    'https://www.nas.gov.sg/archivesonline/data/photographs/thumbnails/19980005615-0064.jpg',
    NULL,
    TRUE
);

INSERT INTO record (title, description, image_url, audio_url)
VALUES 
(
    'Raffles Place (1950s)',
    'A view of Raffles Place with old cars and the clock tower in the background.',
    'https://www.nas.gov.sg/archivesonline/data/photographs/thumbnails/19980005615-0064.jpg',
    NULL
),
(
    'Singapore River (1970s)',
    'Bumboats lining the Singapore River near Boat Quay.',
    'https://www.nas.gov.sg/archivesonline/data/photographs/thumbnails/19980005615-0065.jpg',
    NULL
);
