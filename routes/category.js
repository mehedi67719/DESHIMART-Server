const express = require('express');
const router = express.Router();



module.exports = (productscollection) => {
    router.get("/", async (req, res) => {
        try {
            const category = await productscollection.aggregate([
                { $group: { _id: "$category" } },
                { $project: { _id: 0, category: "$_id" } }
            ]).toArray()


            res.send(category)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "Failed to fetch Category" })
        }
    })




    router.get("/popular", async (req, res) => {
        try {

            const categories = await productscollection.aggregate([
                {
                    $group: {
                        _id: "$category",
                        totalSold: { $sum: "$sold" }
                    }
                },
                {
                    $sort: { totalSold: -1 }
                },
                {
                    $limit: 8
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        totalSold: 1
                    }
                }
            ]).toArray();

            res.send(categories);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Failed to fetch popular categories" });
        }
    });

    return router
};



