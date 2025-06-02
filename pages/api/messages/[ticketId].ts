import { NextApiRequest, NextApiResponse } from 'next';
import initSqlJs from 'sql.js/dist/sql-wasm';
import fs from 'fs';
import path from 'path';

let db: any = null;

async function initDB() {
  if (!db) {
    const wasmPath = path.join(process.cwd(), 'public', 'sql-wasm.wasm');
    const SQL = await initSqlJs({
      wasmBinary: fs.readFileSync(wasmPath)
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
  if (req.method === 'GET') {
    try {
      const { ticketId } = req.query;
      const db = await initDB();
      
      const stmt = db.prepare('SELECT * FROM messages WHERE ticketId = ? ORDER BY timestamp ASC');
      const messages = [];
      while (stmt.step()) {
        messages.push(stmt.getAsObject());
      }
      stmt.free();
      
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}