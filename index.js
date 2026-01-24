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



        app.get("/products", async (req, res) => {
            try {
                const limit = 8;
                const cursor = req.query.cursor;
                const category = req.query.category;

                let query = {};

                if (category) {
                    query.category = category;
                }

                if (cursor) {
                    query._id = { $gt: new ObjectId(cursor) }; // <-- important fix
                }

                const products = await productscollection
                    .find(query)
                    .sort({ _id: 1 })
                    .limit(limit)
                    .toArray();

                res.send(products);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Error fetching products" });
            }
        });



        app.get("/categorys", async (req, res) => {
            try {
                const category = await productscollection.aggregate([
                    { $group: { _id: "$category" } },
                    { $project: { _id: 0, category:"$_id"} }
                ]).toArray()
              

                res.send(category)
            }
            catch (err) {
                console.log(err)
                res.status(500).send({ message: "Failed to fetch Category" })
            }
        })




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
