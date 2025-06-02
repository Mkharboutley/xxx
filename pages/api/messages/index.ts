import { NextApiRequest, NextApiResponse } from 'next';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: any = null;

async function initDB() {
  if (!db) {
    const wasmBinary = fs.readFileSync(path.join(process.cwd(), 'public', 'sql-wasm.wasm'));
    
    const SQL = await initSqlJs({
      wasmBinary
    });
    
    const dbPath = path.join(process.cwd(), 'public', 'voice_messages.db');
    
    let buffer;
    try {
      buffer = fs.readFileSync(dbPath);
    } catch {
      // If file doesn't exist, create new DB
      buffer = Buffer.from([]);
    }
    
    db = new SQL.Database(buffer);
    
    // Create table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        ticketId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        audioData TEXT NOT NULL,
        sender TEXT NOT NULL
      )
    `);
    
    // Save the database to disk
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
  return db;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { id, ticketId, timestamp, audioData, sender } = req.body;
      const db = await initDB();
      
      db.run(
        'INSERT INTO messages (id, ticketId, timestamp, audioData, sender) VALUES (?, ?, ?, ?, ?)',
        [id, ticketId, timestamp, audioData, sender]
      );
      
      // Save changes to disk
      const data = db.export();
      fs.writeFileSync(path.join(process.cwd(), 'public', 'voice_messages.db'), Buffer.from(data));
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ error: 'Failed to save message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}