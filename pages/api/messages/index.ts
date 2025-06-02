import { NextApiRequest, NextApiResponse } from 'next';
import { tblite } from '@vlcn.io/crsqlite-wasm';
import path from 'path';

let db: any = null;

async function initDB() {
  if (!db) {
    db = await tblite.open(path.join(process.cwd(), 'voice_messages.db'));
    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        ticketId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        audioData TEXT NOT NULL,
        sender TEXT NOT NULL
      )
    `);
  }
  return db;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id, ticketId, timestamp, audioData, sender } = req.body;
      const db = await initDB();
      
      await db.exec(
        'INSERT INTO messages (id, ticketId, timestamp, audioData, sender) VALUES (?, ?, ?, ?, ?)',
        [id, ticketId, timestamp, audioData, sender]
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ error: 'Failed to save message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}