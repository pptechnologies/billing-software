import { pool } from "../../config/db";

export async function findUserByEmail(email: string) {
  const r = await pool.query(`SELECT * FROM users WHERE lower(email)=lower($1)`, [email]);
  return r.rows[0] ?? null;
}

export async function createUser(params: {
  email: string;
  password_hash: string;
  name?: string | null;
}) {
  const r = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role, is_active, created_at`,
    [params.email.toLowerCase(), params.password_hash, params.name ?? null]
  );
  return r.rows[0];
}

export async function storeRefreshToken(params: {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  ip?: string | null;
  user_agent?: string | null;
}) {
  const r = await pool.query(
    `INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      params.user_id,
      params.token_hash,
      params.expires_at,         
      params.ip ?? null,
      params.user_agent ?? null,
    ]
  );
  return r.rows[0];
}

export async function findRefreshToken(token_hash: string) {
  const r = await pool.query(
    `SELECT *
     FROM auth_refresh_tokens
     WHERE token_hash=$1 AND revoked_at IS NULL`,
    [token_hash]
  );
  return r.rows[0] ?? null;
}

export async function revokeRefreshToken(id: string) {
  await pool.query(`UPDATE auth_refresh_tokens SET revoked_at=now() WHERE id=$1`, [id]);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await pool.query(`UPDATE auth_refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, [userId]);
}

export async function findUserById(id: string) {
  const r = await pool.query(
    `SELECT id, email, name, role, is_active
     FROM users
     WHERE id = $1`,
    [id]
  );

  return r.rows[0] ?? null;
}
