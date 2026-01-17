import express from 'express';
import cors from 'cors';
import routes from './app/api/routes.js';

import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve audio files and colorized images from tmp directory
app.use('/audio', express.static(path.join(process.cwd(), 'tmp')));
app.use('/color', express.static(path.join(process.cwd(), 'tmp', 'color_cache')));

import journalRoutes from './app/api/journalRoutes.js';

// Routes
app.use('/api', routes);
app.use('/api/journal', journalRoutes);

// Base route for health check
app.get('/', (req, res) => {
  res.send('NAS Scraper API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
