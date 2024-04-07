import { Router } from "express";
import { CartManagerMongo, ProductManager } from "../../dao/index.js";
import { productsMongo } from "../../dao/models/index.js";
import passport from "passport";
import { authMiddleware } from "../../helpers/jwt.js";

const router = Router();
const productManager = new ProductManager();
const cartManager = new CartManagerMongo();

router.get("/", authMiddleware("jwt"), async (_request, response) => {
  const products = await productManager.getProducts();
  response.render("home", { products });
});

router.get(
  "/realtimeproducts",
  authMiddleware("jwt"),
  async (_request, response) => {
    const products = await productManager.getProducts();
    response.render("realTimeProducts", { products });
  }
);

router.get("/products", authMiddleware("jwt"), async (req, res) => {
  try {
    if (!req.cookies.token) return res.redirect("/api/views/login");
    const { page = 1, limit = 10 } = req.query;
    const products = await productsMongo.paginate(
      {},
      { page, limit, lean: true }
    );

    if (req.user.role === "user") {
      req.user.user = true;
    } else if (req.user.role === "premium") {
      req.user.premium = true;
    } else {
      req.user.admin = true;
    }

    products.docs.forEach((product) => {
      product.showForm = product.stock > 0;
      product.isOwner =
        "premium" === req.user.role &&
        req.user.id === product.owner?.toString();
      product.isNotFromOwner = product.showForm && !product.isOwner;
    });

    res.render("products", { products, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
});

router.get("/carts/:cid", authMiddleware("jwt"), async (req, res) => {
  try {
    if (!req.cookies.token) return res.redirect("/api/views/login");
    const { cid } = req.params;
    let cart = await cartManager.getCartById(cid);
    let serializedProducts = JSON.stringify(cart?.products || []);
    res.render("carts", {
      cart: cart?.toJSON() || [],
      email: req.user.email,
      serializedProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
});

router.get(
  "/profile",
  authMiddleware("jwt"),
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      if (!req.cookies.token) return res.redirect("/api/views/login");
      res.render("profile", { user: req.user });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error });
    }
  }
);

router.get("/login", async (req, res) => {
  try {
    if (req.cookies.token) return res.redirect("/api/views/products");
    res.render("login", {});
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
});
router.get("/register", async (req, res) => {
  try {
    if (req.cookies.token) return res.redirect("/api/views/products");
    res.render("register", {});
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
});
router.get("/generate-new-password", async (req, res, next) => {
  try {
    const { token } = req.query;

    validateToken(token)
      .then(async (payload) => {
        res.render("recoveryPassword", { user: payload });
      })
      .catch((error) => {
        if (error.name === "TokenExpiredError") {
          return res.redirect("/api/views/login");
        }
      });
  } catch (error) {
    next(error);
  }
});

export default router;
