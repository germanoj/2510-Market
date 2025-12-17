import db from "../client.js";

export async function getUserById(id) {
  const {
    rows: [user],
  } = await db.query(
    `SELECT id, username
     FROM users
     WHERE id = $1;`,
    [id]
  );

  return user || null;
}
