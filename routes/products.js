import express from "express";
import db from "#db/client";
import getUserFromToken from "../middleware/getUserFromToken.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, title, description, price FROM products ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/orders", getUserFromToken, async (req, res, next) => {
  try {
    if (!req.user) return res.sendStatus(401);

    const productId = Number(req.params.id);

    const productResult = await db.query(
      `SELECT id FROM products WHERE id = $1`,
      [productId]
    );
    if (!productResult.rows[0]) return res.sendStatus(404);

    const result = await db.query(
      `SELECT o.id, o.date, o.note, o.user_id
       FROM orders o
       JOIN orders_products op ON op.order_id = o.id
       WHERE o.user_id = $1 AND op.product_id = $2
       ORDER BY o.id`,
      [req.user.id, productId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.sendStatus(400);

    const result = await db.query(
      "SELECT id, title, description, price FROM products WHERE id = $1",
      [id]
    );

    const product = result.rows[0];
    if (!product) return res.sendStatus(404);

    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
