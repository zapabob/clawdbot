import Database from "better-sqlite3";
const db = new Database("C:/Users/downl/.openclaw/memory/main.sqlite");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map((t) => t.name).join(", "));
for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();
    console.log(`Table ${table.name}:`, JSON.stringify(rows));
  } catch (err) {
    console.log(`Error reading table ${table.name}:`, err.message);
  }
}
db.close();
