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

    return router
};



