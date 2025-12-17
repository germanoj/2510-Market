import express from "express";
import usersRouter from "./routes/users.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import getUserFromToken from "./middleware/getUserFromToken.js";

const app = express();

app.use(express.json());

app.use(getUserFromToken);

app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

export default app;
