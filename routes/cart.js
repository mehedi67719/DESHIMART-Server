const express = require('express');
const { ObjectId } = require('mongodb');
const verifyToken = require('./middleware/verifyToken');
const router = express.Router();



module.exports = (cartcollection, favoritecollection) => {

    router.post("/from-favorite",verifyToken, async (req, res) => {
        const cartdata = req.body

        try {
            const result = await cartcollection.insertOne(cartdata);
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "Internal server error", })
        }
    })



    router.post("/",verifyToken, async (req, res) => {
        const cartdata = req.body

        try {
            const result = await cartcollection.insertOne(cartdata);
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "Internal server error", })
        }
    })



    router.get("/cart-count/:email",verifyToken, async (req, res) => {
        try {
            const email = req.params.email;

            if (!email) {
                return res.status(400).send({ message: "Email is required" });
            }

            const count = await cartcollection.countDocuments({
                userEmail: email
            });

            res.send({ count });

        } catch (error) {
            console.log(error);
            res.status(500).send({ message: "Server Error" });
        }
    });

    router.get("/:email",verifyToken, async (req, res) => {
        try {
            const email = req.params.email;
            const result = await cartcollection.find({ userEmail: email }).toArray();
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "server error" })
        }
    })







    router.delete("/:id",verifyToken, async (req, res) => {
        try {
            const id = req.params.id;
            const result = await cartcollection.deleteOne({ _id: new ObjectId(id) })
            if (result.deletedCount === 0) {
                return res.status(404).send({ success: false, message: "Item not found" });
            }

            res.send({ success: true, message: "Item removed", result });
        }
        catch (err) {
            console.error(err);
            res.status(500).send({ success: false, message: "Internal server error" });
        }
    })




    return router
}