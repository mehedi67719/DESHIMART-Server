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


    router.get("/seller/popular", async (req, res) => {
        try {
            const sellerEmail = req.query.sellerEmail;

            if (!sellerEmail) {
                return res.status(400).send({ message: "Seller email is required" });
            }

            const categories = await productscollection.aggregate([
                {
                    $match: { sellerEmail: sellerEmail }
                },
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


    router.get("/seller/toprating", async (req, res) => {
        try {
            const sellerEmail = req.query.sellerEmail;

            if (!sellerEmail) {
                return res.status(400).send({ message: "Seller email is required" });
            }

            const categories = await productscollection.aggregate([
                {
                    $match: { sellerEmail: sellerEmail }
                },
                {
                    $group: {
                        _id: "$category",
                        avgRating: { $avg: "$rating" }   
                    }
                },
                {
                    $sort: { avgRating: -1 }   
                },
                {
                    $limit: 8
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        avgRating: { $round: ["$avgRating", 2] } 
                    }
                }
            ]).toArray();

            res.send(categories);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Failed to fetch top rating categories" });
        }
    });


    return router
};



