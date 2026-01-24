require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = 3000

app.use(express.json());
app.use(cors());






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



        const productsrouter=require("./routes/Products")
        const categoryrouter=require("./routes/category")
        const brandrouter=require("./routes/brands")


        app.use("/products",productsrouter(productscollection))
        app.use("/categorys",categoryrouter(productscollection))
        app.use("/brands",brandrouter(productscollection))













        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
