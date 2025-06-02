import { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'voice_messages.db'));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { ticketId } = req.query;
      
      const stmt = db.prepare(
        'SELECT * FROM messages WHERE ticketId = ? ORDER BY timestamp ASC'
      );
      
      const messages = stmt.all(ticketId);
      
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}