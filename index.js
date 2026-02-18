require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = 3000
const http = require('http');
const { Server } = require('socket.io');

app.use(express.json());
app.use(cors());



const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } 
});


const uri = process.env.MONGO_URI;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();



        const db = client.db("deshimart");
        const productscollection = db.collection("products")
        const Storescollection = db.collection("localstores")
        const cartcollection = db.collection("cart")
        const favoritecollection = db.collection("favorite")
        const paymentcollection = db.collection("payment")
        const usercollection = db.collection("user")
        const chatcollection=db.collection("chat")



        const productsrouter = require("./routes/Products")
        const categoryrouter = require("./routes/category")
        const brandrouter = require("./routes/brands")
        const Storesrouter = require("./routes/Stores")
        const cartrouter = require("./routes/cart")
        const favoriterouter = require("./routes/favorite")
        const paymentrouter = require("./routes/payment")
        const userrouter = require("./routes/user")
        const chatrouter=require("./routes/chat")


        app.use("/products", productsrouter(productscollection))
        app.use("/categorys", categoryrouter(productscollection))
        app.use("/brands", brandrouter(productscollection))
        app.use("/Stores", Storesrouter(Storescollection, usercollection))
        app.use("/cart", cartrouter(cartcollection, favoritecollection))
        app.use("/favorite", favoriterouter(favoritecollection, productscollection))
        app.use("/payment", paymentrouter(paymentcollection, cartcollection))
        app.use("/user", userrouter(usercollection))
        app.use("/chat",chatrouter(chatcollection,io,usercollection))













        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Hello World!')
})

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
