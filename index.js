const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { reset } = require("nodemon");


const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    else {
      req.decoded = decoded;
      next();
    }
  });

}

// airUser
// gfZCXs3e58hppZUd



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1mscpew.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    await client.connect();
    const productsCollection = client.db('inventory').collection('product');
    const ordersCollection = client.db("inventory").collection("orders");
    const usersCollection = client.db("inventory").collection("user");
    const paymentCollection = client.db("inventory").collection("payment");
    const reviewsCollection = client.db("inventory").collection("reviews");
    const profileCollection = client.db("inventory").collection("profile");
    const blogsCollection = client.db('inventory').collection('blog');



   
  

    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product)
    });
    // reviews area
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    // order area

    app.get("/orders",verifyJwt, async (req, res) => {
      const email = req.query.email;
      const decodeEmail = req.decoded.email;
      if (email === decodeEmail) {
        const query = { userEmail: email };
        const orders = await ordersCollection.find(query).toArray();
        res.send(orders);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });

    // user area

    app.get("/users",verifyJwt,async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });
    // all order
    
    app.get("/allOrders", verifyJwt, async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });
    // post working
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const query = { partName: orders.partName, userEmail: orders.userEmail };
      const exists = await ordersCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, orders: exists });
      }
      const result = await ordersCollection.insertOne(orders);
      res.send({ success: true, result });
    });
    // order area
   
    app.get('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const orders = await ordersCollection.findOne(query);
      res.send(orders);
    });
    // review area
    app.post("/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewsCollection.insertOne(reviews);
      res.send(result);
    });

    // admin area
    app.get('/admin/:email', async(req,res) =>{
      const email = req.params.email;
      const user = await usersCollection.findOne({email: email});
      const isAdmin = user.role=== 'admin';
      res.send({admin: isAdmin})
    });

     // put working

    //  user area
     app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, accessToken: token });
    });

    // admin area
    app.put("/user/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else{
        res.status(403).send({message: 'forbidden'})
      }
    });

    // Delete  working

    // products area

    app.delete('/products/:id',verifyJwt, async(req,res)=>{
      const id = req.params.id;
      const filter={_id: ObjectId(id)};
      const result = await productsCollection.deleteOne(filter);
      res.send(result)
    });

    // order area

    app.delete('/orders',verifyJwt, async(req,res)=>{
      const email = req.query.email;
      console.log(email);
      const filter= {userEmail:email};
      const result = await ordersCollection.deleteOne(filter);
      res.send(result)
    });
    // all Order

    app.delete('/allOrders/:id',verifyJwt, async(req,res)=>{
      const id = req.params.id;
      const filter={_id: ObjectId(id)};
      const result = await ordersCollection.deleteOne(filter);
      res.send(result)
    });


  }
  finally {

  }

}

run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})