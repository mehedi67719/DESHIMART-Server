const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

module.exports = (favoritecollection, productscollection) => {
    router.post("/", async (req, res) => {
        try {
            const { productId, userEmail } = req.body;
            if (!productId || !userEmail) return res.status(400).send({ message: "Invalid data" });

            const exists = await favoritecollection.findOne({
                productId: new ObjectId(productId),
                userEmail: userEmail
            });

            if (exists) return res.status(200).send({ message: "Already in favorites", favorited: true });

            const result = await favoritecollection.insertOne({
                productId: new ObjectId(productId),
                userEmail: userEmail,
                createdAt: new Date()
            });

            res.status(201).send({ message: "Added to favorites", favorited: true, id: result.insertedId });
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });

    router.delete("/", async (req, res) => {
        try {
            const { productId, userEmail } = req.body;
            const result = await favoritecollection.deleteOne({
                productId: new ObjectId(productId),
                userEmail: userEmail
            });

            if (result.deletedCount === 0) return res.status(404).send({ message: "Favorite not found" });
            res.status(200).send({ message: "Removed from favorites", favorited: false });
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });

    router.get("/check", async (req, res) => {
        try {
            const { productId, userEmail } = req.query;
            if (!productId || !userEmail) return res.status(400).send({ exists: false });

            const exists = await favoritecollection.findOne({
                productId: new ObjectId(productId),
                userEmail: userEmail
            });

            res.status(200).send({ exists: !!exists, favorited: !!exists });
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });

    router.post("/toggle", async (req, res) => {
        try {
            const { productId, userEmail } = req.body;
            if (!productId || !userEmail) return res.status(400).send({ message: "Invalid data" });

            const query = { productId: new ObjectId(productId), userEmail: userEmail };
            const exists = await favoritecollection.findOne(query);

            if (exists) {
                await favoritecollection.deleteOne({ _id: exists._id });
                return res.send({ favorited: false, message: "Removed from favorites" });
            } else {
                await favoritecollection.insertOne({ ...query, createdAt: new Date() });
                return res.send({ favorited: true, message: "Added to favorites" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });

    router.get("/user/:email", async (req, res) => {
        try {
            const userEmail = req.params.email;
            const favorites = await favoritecollection.find({ userEmail: userEmail }).toArray();
            
            const productIds = favorites.map(fav => fav.productId);
            
            if (productIds.length === 0) return res.status(200).send([]);
            
            const objectIds = productIds.map(id => new ObjectId(id));
            const products = await productscollection.find({ _id: { $in: objectIds } }).toArray();
            
            const result = favorites.map(fav => {
                const product = products.find(p => p._id.toString() === fav.productId.toString());
                return {
                    _id: fav._id,
                    productId: fav.productId,
                    userEmail: fav.userEmail,
                    createdAt: fav.createdAt,
                    ...product
                };
            });
            
            res.status(200).send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });

    return router;
};