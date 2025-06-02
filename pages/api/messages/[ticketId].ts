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
  if (req.method === 'GET') {
    try {
      const { ticketId } = req.query;
      const db = await initDB();
      
      const messages = await db.execO(
        'SELECT * FROM messages WHERE ticketId = ? ORDER BY timestamp ASC',
        [ticketId]
      );
      
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}