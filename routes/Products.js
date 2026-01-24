const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');



module.exports = (productscollection) => {


    router.get("/", async (req, res) => {
        try {
            const limit = 8;
            const cursor = req.query.cursor;
            const category = req.query.category;

            let query = {};

            if (category) {
                query.category = category;
            }

            if (cursor) {
                query._id = { $gt: new ObjectId(cursor) }; 
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



    return router;
}



