import bcrypt from "bcrypt";
import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  await db.query(
    "TRUNCATE orders_products, orders, products, users RESTART IDENTITY CASCADE;"
  );

  const products = [
    {
      title: "Trail Bottle",
      description: "Insulated stainless steel bottle",
      price: 19.99,
    },
    {
      title: "Climbing Chalk",
      description: "Magnesium carbonate chalk bag refill",
      price: 8.99,
    },
    {
      title: "Headlamp",
      description: "Rechargeable headlamp, 300 lumens",
      price: 29.99,
    },
    {
      title: "Packable Jacket",
      description: "Lightweight windbreaker",
      price: 59.99,
    },
    {
      title: "Hiking Socks",
      description: "Merino wool blend socks",
      price: 14.99,
    },
    { title: "Camping Mug", description: "Durable enamel mug", price: 12.99 },
    { title: "Dry Bag", description: "Waterproof bag for gear", price: 24.99 },
    {
      title: "Trekking Poles",
      description: "Adjustable aluminum poles",
      price: 39.99,
    },
    {
      title: "First Aid Kit",
      description: "Compact kit for day hikes",
      price: 18.99,
    },
    {
      title: "Microfiber Towel",
      description: "Quick-dry travel towel",
      price: 15.99,
    },
  ];

  const insertedProducts = [];
  for (const p of products) {
    const { rows } = await db.query(
      "INSERT INTO products (title, description, price) VALUES ($1, $2, $3) RETURNING *;",
      [p.title, p.description, p.price]
    );
    insertedProducts.push(rows[0]);
  }

  const hashedPassword = await bcrypt.hash("password123", 10);

  const { rows: userRows } = await db.query(
    "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;",
    ["seed_user", hashedPassword]
  );
  const user = userRows[0];

  const { rows: orderRows } = await db.query(
    "INSERT INTO orders (date, note, user_id) VALUES ($1, $2, $3) RETURNING *;",
    ["1111-11-11", null, user.id]
  );
  const order = orderRows[0];

  for (const product of insertedProducts.slice(0, 5)) {
    await db.query(
      "INSERT INTO orders_products (order_id, product_id, quantity) VALUES ($1, $2, $3);",
      [order.id, product.id, 1]
    );
  }
}
