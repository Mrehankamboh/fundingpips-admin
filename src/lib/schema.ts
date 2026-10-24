import type { Sql } from "./db";
import { fundingPipsPriceSeeds } from "./catalog";

let ready = false;

/** FundingPips auth + challenges + admin pricing/tickets. */
export async function ensureSchema(sql: Sql): Promise<void> {
  if (ready) return;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain text`;
  await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_uidx
    ON users (google_id)
    WHERE google_id IS NOT NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS challenges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      evaluation_type text NOT NULL,
      account_size numeric NOT NULL,
      platform text NOT NULL DEFAULT 'MetaTrader 5',
      plan text,
      addons jsonb NOT NULL DEFAULT '[]'::jsonb,
      fee numeric NOT NULL DEFAULT 0,
      quantity int NOT NULL DEFAULT 1,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS challenge_prices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_name text NOT NULL,
      account_size numeric NOT NULL,
      price numeric NOT NULL,
      leverage text NOT NULL DEFAULT '1:100',
      UNIQUE (challenge_name, account_size)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      visitor_key text,
      visitor_name text,
      visitor_email text,
      subject text NOT NULL,
      status text NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author text NOT NULL,
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM challenge_prices`;
  if (!Number(count)) {
    for (const row of fundingPipsPriceSeeds()) {
      await sql`
        INSERT INTO challenge_prices (challenge_name, account_size, price, leverage)
        VALUES (${row.challenge_name}, ${row.account_size}, ${row.price}, ${row.leverage})
        ON CONFLICT (challenge_name, account_size) DO NOTHING
      `;
    }
  }

  const [{ tcount }] = await sql`SELECT count(*)::int AS tcount FROM tickets`;
  if (!Number(tcount)) {
    const inserted = await sql`
      INSERT INTO tickets (visitor_name, visitor_email, subject, status)
      VALUES
        ('Trader Support', 'trader@example.com', 'Payout timing question', 'open'),
        ('Alaa S.', 'alaa@example.com', 'Challenge rules clarification', 'in_progress')
      RETURNING id, subject
    `;
    if (inserted[0]) {
      await sql`
        INSERT INTO ticket_messages (ticket_id, author, body)
        VALUES
          (${inserted[0].id}, 'user', 'Hi, how long do rewards usually take after I request a payout?'),
          (${inserted[0].id}, 'admin', 'Thanks for reaching out — typical processing is within a few hours on business days.')
      `;
    }
    if (inserted[1]) {
      await sql`
        INSERT INTO ticket_messages (ticket_id, author, body)
        VALUES (${inserted[1].id}, 'user', 'Can you confirm the max daily loss on the 2 Step Pro $100K?')
      `;
    }
  }

  const adminEmail = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  if (adminEmail) {
    await sql`UPDATE users SET role = 'admin' WHERE lower(email) = ${adminEmail}`;
  }

  ready = true;
}
