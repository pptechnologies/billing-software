import { pool } from "../../src/config/db";
import process from "process";

async function promoteAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email");
    console.error("Usage: npm run promote-admin -- user@example.com");
    process.exit(1);
  }

  console.log(`Looking up user: ${email}`);

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, email, role FROM users WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) {
      console.error(" User not found");
      process.exit(1);
    }

    const user = rows[0];

    if (user.role === "admin") {
      console.log("User is already an admin");
      process.exit(0);
    }

    await client.query(
      `UPDATE users SET role = 'admin' WHERE id = $1`,
      [user.id]
    );

    console.log("SUCCESS");
    console.log(` ${user.email}`);
    console.log(` Role: ${user.role} → admin`);
  } catch (err) {
    console.error(" Failed to promote user");
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

promoteAdmin();
