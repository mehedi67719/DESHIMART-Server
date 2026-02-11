const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

module.exports = (Storescollection, usercollection) => {
    router.get("/", async (req, res) => {
        try {
            const { cursor } = req.query;
            const limit = 6;

            let query = {};

            if (cursor) {
                query._id = { $gt: new ObjectId(cursor) };
            }

            const result = await Storescollection
                .find(query)
                .limit(limit)
                .toArray();


            const response = {
                stores: result,
                nextCursor: result.length > 0 ? result[result.length - 1]._id : null,
                hasMore: result.length === limit
            };

            res.send(response);
        } catch (error) {
            res.status(500).send({
                message: "Failed to fetch stores",
                error: error.message,
            });
        }
    });


    router.post("/", async (req, res) => {
        try {
            const data = req.body;
            const result = await Storescollection.insertOne(data);

            await usercollection.updateOne(
                { email: data.email },
                {
                    $set: {
                        role: "requested-seller",
                    },
                }
            );

            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: err.message });
        }
    });



    return router;
};