const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const PASSWORD = "asDF2427$raku.s";
const PROJECT_REF = "wunhgenttvvhcfzzkkti";

async function tryConnect(config, label) {
  const client = new Client({ ...config, connectionTimeoutMillis: 8000 });
  try {
    console.log(`Trying ${label}...`);
    await client.connect();
    console.log(`  Connected via ${label}`);

    const sql = fs.readFileSync(
      path.join(__dirname, "..", "supabase", "migrations", "001_global_events.sql"),
      "utf8"
    );
    await client.query(sql);
    console.log("  Migration applied.");

    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'global_events'"
    );
    console.log(`  Verified: ${res.rows.map((r) => r.table_name).join(", ")}`);

    await client.end();
    return true;
  } catch (err) {
    console.log(`  Failed: ${err.message}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  const configs = [
    // Direct connection with IPv4
    {
      label: "direct (IPv4)",
      config: {
        host: `db.${PROJECT_REF}.supabase.co`,
        port: 5432,
        user: "postgres",
        password: PASSWORD,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      },
    },
    // Pooler session mode
    {
      label: "pooler session (5432)",
      config: {
        host: "aws-0-us-west-1.pooler.supabase.com",
        port: 5432,
        user: `postgres.${PROJECT_REF}`,
        password: PASSWORD,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      },
    },
    // Pooler transaction mode
    {
      label: "pooler transaction (6543)",
      config: {
        host: "aws-0-us-west-1.pooler.supabase.com",
        port: 6543,
        user: `postgres.${PROJECT_REF}`,
        password: PASSWORD,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      },
    },
  ];

  for (const { label, config } of configs) {
    const ok = await tryConnect(config, label);
    if (ok) {
      console.log("\nSuccess!");
      process.exit(0);
    }
  }

  console.error("\nAll connection attempts failed.");
  process.exit(1);
}

main();
