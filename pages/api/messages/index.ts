import { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'voice_messages.db'));

// Create messages table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    ticketId TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    audioData TEXT NOT NULL,
    sender TEXT NOT NULL
  )
`);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id, ticketId, timestamp, audioData, sender } = req.body;
      
      const stmt = db.prepare(
        'INSERT INTO messages (id, ticketId, timestamp, audioData, sender) VALUES (?, ?, ?, ?, ?)'
      );
      
      stmt.run(id, ticketId, timestamp, audioData, sender);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ error: 'Failed to save message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}