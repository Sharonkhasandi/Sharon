const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files (index.html, css, js, images)
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Read existing contacts (if any)
    let contacts = [];
    try {
      const contents = await fs.readFile(CONTACTS_FILE, 'utf8');
      contacts = JSON.parse(contents || '[]');
      if (!Array.isArray(contacts)) contacts = [];
    } catch {
      contacts = [];
    }

    const entry = {
      id: Date.now(),
      name: String(name).trim(),
      email: String(email).trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };

    contacts.push(entry);

    // Write back to disk
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf8');

    return res.status(201).json({ ok: true, entry });
  } catch (err) {
    console.error('Failed to save contact submission:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => process.exit(0));
});
