const express = require("express");
const app = express();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
// const admin = require("firebase-admin");
const fileUpload = require("express-fileupload");
// const stripe = require("stripe")(process.env.API_KEY);
const stripe = require("stripe")(
  "sk_test_51K8HzhF6aqSklOshNmM4uFrUCRgWbwZJwzXezAskrrOpAk35kO83JotTlzRR34CUnRvaGyntQqmgRk0aLwlEPiUQ00MIv3gPKW"
);

require("dotenv").config();
const { MongoClient } = require("mongodb");

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxgrl.mongodb.net/phone_online_shop?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    const database = client.db("phone_online_shop");
    const productsCollections = database.collection("products");
    const usersCollection = database.collection("users");
    const orderRequestCollection = database.collection("orderRequest");
    const reviewsCollection = database.collection("reviews");
    const productReviewCollection = database.collection("productReviews");

    //GET API to get all products
    app.get("/products", async (req, res) => {
      const cursor = productsCollections.find({});
      const products = await cursor.toArray();
      res.json(products);
    });
    // GET API to get single  products
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollections.findOne(query);
      res.json(product);
    });

    // GET API to get all users
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    // GET API to get single uer
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      // console.log(query);
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // GET API to get single uer via email for update
    app.get("/users/userEmail/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.json(user);
    });

    // GET API to get all order requests
    app.get("/orderRequest", async (req, res) => {
      const cursor = orderRequestCollection.find({});
      const orders = await cursor.toArray();
      res.json(orders);
    });

    // GET API to get single order request using id
    app.get("/orderRequest/orderId/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderRequestCollection.findOne(query);
      res.json(order);
    });

    // GET API for reviews
    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const reviews = await cursor.toArray();
      res.json(reviews);
    });

    //get all reviews

    app.get("/productReviews", async (req, res) => {
      const cursor = productReviewCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    // Order Request POST API
    app.post("/orderRequest", async (req, res) => {
      const orderReq = req.body;
      const result = await orderRequestCollection.insertOne(orderReq);
      res.json(result);
    });

    //POST API for user register
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // POST API for add a product
    app.post("/products", async (req, res) => {
      const name = req.body.name;
      const image = req.files.img;
      const soldBy = req.body.soldBy;
      const stock = req.body.stock;
      const brand = req.body.brand;
      const display = req.body.display;
      const cpu = req.body.cpu;
      const memory = req.body.memory;
      const rear_camera = req.body.rear_camera;
      const front_camera = req.body.front_camera;
      const price = req.body.price;
      const color = req.body.color;
      const ratings = req.body.ratings;

      const imageData = image.data;
      const encodedImage = imageData.toString("base64");
      const imageBuffer = Buffer.from(encodedImage, "base64");
      const product = {
        name: name,
        img: imageBuffer,
        soldBy: soldBy,
        stock: stock,
        brand: brand,
        display: display,
        cpu: cpu,
        memory: memory,
        rear_camera: rear_camera,
        front_camera: front_camera,
        price: price,
        color: color,
        ratings: ratings,
      };
      const result = await productsCollections.insertOne(product);
      res.json(result);
    });
    // Review PUT API
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.json(result);
    });
    // Product Review PUT API
    app.post("/productReviews", async (req, res) => {
      const productReview = req.body;
      const result = await productReviewCollection.insertOne(productReview);
      res.json(result);
    });

    //PUT API for update user....for register operation
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    //PUT API for admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    //PUT API for update user info  by email
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;
      const filter = { email: updatedUser.email };
      const options = { upsert: true };
      const updateProDoc = {
        $set: {
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
          phoneNumber: updatedUser.phoneNumber,
          address: updatedUser.address,
          city: updatedUser.city,
          country: updatedUser.country,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateProDoc,
        options
      );
      res.json(result);
    });
    //PUT API for update product info  by id
    app.put("/products/:id", async (req, res) => {
      const uId = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: ObjectId(uId) };
      const options = { upsert: true };
      const updateProDoc = {
        $set: {
          name: updatedProduct.name,
          img: updatedProduct.img,
          soldBy: updatedProduct.soldBy,
          stock: updatedProduct.stock,
          brand: updatedProduct.brand,
          display: updatedProduct.display,
          cpu: updatedProduct.cpu,
          memory: updatedProduct.memory,
          rear_camera: updatedProduct.rear_camera,
          front_camera: updatedProduct.front_camera,
          price: updatedProduct.price,
          color: updatedProduct.color,
          ratings: updatedProduct.ratings,
        },
      };
      const result = await productsCollections.updateOne(
        filter,
        updateProDoc,
        options
      );
      res.json(result);
    });

    // update status API
    app.put("/status/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const update = {
        $set: { status: req.body.status },
      };
      const result = await orderRequestCollection.updateOne(
        filter,
        update,
        option
      );
      res.json(result);
    });

    // PUT API for update Product's info
    app.put("/products/:id", async (req, res) => {
      const pId = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: ObjectId(pId) };
      const options = { upsert: true };
      const updateProDoc = {
        $set: {
          name: updatedProduct.name,
          img: updatedProduct.img,
          soldBy: updatedProduct.soldBy,
          stock: updatedProduct.stock,
          brand: updatedProduct.brand,
          display: updatedProduct.display,
          cpu: updatedProduct.cpu,
          memory: updatedProduct.memory,
          rear_camera: updatedProduct.rear_camera,
          front_camera: updatedProduct.front_camera,
          price: updatedProduct.price,
          color: updatedProduct.color,
          ratings: updatedProduct.ratings,
        },
      };
      const result = await productsCollections.updateOne(
        filter,
        updateProDoc,
        options
      );
      res.json(result);
    });

    // update order request PUT API
    app.put("/orderRequest/orderId/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await orderRequestCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    //order DELETE API
    app.delete("/orderRequest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderRequestCollection.deleteOne(query);
      res.json(result);
    });

    //Product DELETE API
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollections.deleteOne(query);
      res.json(result);
    });

    //DELETE API for delte user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.json(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.totalOrderCost;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Online shop management system server is running");
});

app.listen(port, () => {
  console.log("Server hitting on port", port);
});
