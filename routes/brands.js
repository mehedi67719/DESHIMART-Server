const express = require('express');
const router = express.Router();



module.exports = (productscollection) => {
    router.get("/", async (req, res) => {
        try {
            const brand = await productscollection.aggregate([
                { $group: { _id: "$brand" } },
                { $project: { _id: 0, brand: "$_id" } }
            ]).toArray()


            res.send(brand)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "Failed to fetch brand" })
        }
    })

    return router
};