import express from "express";
import db from "#db/client";
import getUserFromToken from "../middleware/getUserFromToken.js";

const router = express.Router();

router.use(getUserFromToken);

router.use((req, res, next) => {
  if (!req.user) return res.sendStatus(401);
  next();
});

async function getOrderById(orderId) {
  const result = await db.query(
    `SELECT id, date, note, user_id
     FROM orders
     WHERE id = $1`,
    [orderId]
  );
  return result.rows[0];
}

async function productExists(productId) {
  const result = await db.query(`SELECT id FROM products WHERE id = $1`, [
    productId,
  ]);
  return Boolean(result.rows[0]);
}

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, date, note, user_id
       FROM orders
       WHERE user_id = $1
       ORDER BY id`,
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { date, note } = req.body ?? {};
    if (!date) return res.sendStatus(400);

    const result = await db.query(
      `INSERT INTO orders (date, note, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, date, note, user_id`,
      [date, note ?? null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await getOrderById(orderId);
    if (!order) return res.sendStatus(404);
    if (order.user_id !== req.user.id) return res.sendStatus(403);

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/products", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { productId, quantity } = req.body ?? {};

    if (!productId || !quantity) return res.sendStatus(400);

    const order = await getOrderById(orderId);
    if (!order) return res.sendStatus(404);
    if (order.user_id !== req.user.id) return res.sendStatus(403);

    const exists = await productExists(productId);
    if (!exists) return res.sendStatus(400);

    const result = await db.query(
      `INSERT INTO orders_products (order_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (order_id, product_id)
       DO UPDATE SET quantity = orders_products.quantity + EXCLUDED.quantity
       RETURNING order_id, product_id, quantity`,
      [orderId, productId, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/products", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);

    const order = await getOrderById(orderId);
    if (!order) return res.sendStatus(404);
    if (order.user_id !== req.user.id) return res.sendStatus(403);

    const result = await db.query(
      `SELECT p.id, p.title, p.description, p.price, op.quantity
       FROM orders_products op
       JOIN products p ON p.id = op.product_id
       WHERE op.order_id = $1
       ORDER BY p.id`,
      [orderId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
