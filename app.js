const express = require("express");
const { executeQuery } = require("./database");
const path = require("path");
const ejs = require("ejs");
const { clear } = require("console");
const app = express();

const PORT = process.env.PORT || 4000;

let isAuthenticated = false;
let userID = -1;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
console.log(__dirname);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const isAuthenticatedMiddleware = (req, res, next) => {
  if (isAuthenticated) {
    next(); // Continue to the next middleware or route handler
  } else {
    res.redirect("/login"); // Redirect to login if not authenticated
  }
};

// Apply the isAuthenticatedMiddleware to all routes except "/login" and "/signup"
app.use((req, res, next) => {
  if (req.path === "/login" || req.path === "/signup") {
    next(); // Allow access to login and signup routes without authentication
  } else {
    isAuthenticatedMiddleware(req, res, next); // Apply isAuthenticatedMiddleware to other routes
  }
});

/*

Routes 

*/
app.get("/home", (req, res) => {
  res.render("index");
});

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/order", async (req, res) => {
  const user = await executeQuery(`
    SELECT * FROM users WHERE user_id = ${userID};
  `);
  const userAddress = await executeQuery(`
    SELECT * FROM addresses WHERE user_id = 23;
  `);

  const orderItems = await executeQuery(`
    SELECT c.order_id, c.user_id, c.product_id AS cart_product_id, c.quantity,
    p.product_id AS product_id, p.coffee_name, p.coffee_type,
    p.origin, p.price, p.roasting_level, p.aroma, p.description
    FROM orders c
    INNER JOIN products p ON c.product_id = p.product_id
    WHERE c.user_id = ${userID};
  `);
  res.render("orders", { orderItems, user, userAddress });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/cart", async (req, res) => {
  try {
    console.log(userID);
    const cartItems = await executeQuery(`
      SELECT c.cart_id, c.user_id, c.product_id AS cart_product_id, c.quantity,
      p.product_id AS product_id, p.coffee_name, p.coffee_type,
      p.origin, p.price, p.roasting_level, p.aroma, p.description
      FROM cart c
      INNER JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = ${userID};
    `);
    let totalBill = 0;
    cartItems.forEach((item) => {
      totalBill += item.quantity * item.price;
    });
    console.log("Total Bill:", totalBill);
    console.log(cartItems);
    res.render("cart", { cartItems, totalBill }); // Pass cartItems to the cart EJS template
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching cart items.");
  }
});

app.get("/featured", async (req, res) => {
  const products = await executeQuery("select * from products");
  res.render("featuredProducts", { products }); // Pass cartItems to the cart EJS template
});

app.get("/recent", (req, res) => {
  res.render("recentlyLaunched");
});

app.get("/thanks", async (req, res) => {
  const clearOrders = await executeQuery(
    `DELETE FROM orders where user_id = ${userID}`
  );
  const orderId = Math.floor(Math.random() * 1000000);
  const cartItems = await executeQuery(`
    SELECT  c.product_id , c.quantity from cart c where user_id = ${userID};
  `);
  for (let i = 0; i < cartItems.length; i++) {
    const createOrder = await executeQuery(`
      INSERT INTO orders (order_id, user_id, product_id, quantity) VALUES ('${orderId}', ${userID}, ${cartItems[i].product_id}, ${cartItems[i].quantity});
    `);
  }

  const clearCart = await executeQuery(
    `DELETE FROM cart where user_id = ${userID}`
  );

  res.render("thanks");
});

app.get('/new', (req, res) => {
  res.render('new');
});

/**
 *
 *
 *
 *
 *
 *  DB LOGIC
 *
 *
 *
 */
app.post("/signup", async (req, res) => {
  const { username, fname, lname, email, pass  ,phone } = req.body;
  const sql =
    "INSERT INTO users (username, first_name, last_name, email, password,phone_number) VALUES ('" +
    username +
    "', '" +
    fname +
    "', '" +
    lname +
    "', '" +
    email +
    "', '" +
    pass +
    "', '" +
    phone +
    "')";

  try {
    const result = await executeQuery(sql);
    res.redirect("/login");
  } catch (error) {
    res.status(500).send("Error creating user");
  }
});

app.post("/login", async (req, res) => {
  const { email, pass } = req.body;
  const sql =
    "SELECT * FROM users WHERE email = '" +
    email +
    "' AND password = '" +
    pass +
    "'";

  try {
    const result = await executeQuery(sql);
    if (result.length > 0) {
      userID = result[0].user_id;
      isAuthenticated = true;
      console.log(result);
      res.redirect("/home");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.status(500).send("Error logging in");
  }
});

app.post("/removeFromCart", async (req, res) => {
  const cartId = req.body.itemId;
  const removeItem = await executeQuery(`
    DELETE FROM cart where cart_id = ${cartId};
  `);

  res.sendStatus(200);
});

app.post("/addToCart", async (req, res) => {
  const productId = req.body.productId;
  const cartItem = await executeQuery(`
    SELECT * FROM cart WHERE user_id = ${userID} AND product_id = ${productId};
  `);

  if (cartItem.length > 0) {
    const updateItem = await executeQuery(`
      UPDATE cart SET quantity = quantity + 1 WHERE user_id = ${userID} AND product_id = ${productId};
    `);
  } else {
    const addItem = await executeQuery(`
      INSERT INTO cart (user_id, product_id, quantity) VALUES (${userID}, ${productId}, 1);
    `);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
