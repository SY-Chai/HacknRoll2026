import express from 'express';
import cors from 'cors';
import routes from './app/api/routes.js';

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve audio files from tmp directory
app.use('/audio', express.static(path.join(process.cwd(), 'tmp')));

// Routes
app.use('/api', routes);

// Base route for health check
app.get('/', (req, res) => {
  res.send('NAS Scraper API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
