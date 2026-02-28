const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

module.exports = (Storescollection, usercollection, notificationcollection) => {
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

          
            if (!data.email || !data.shopName) {
                return res.status(400).send({ success: false, message: "Email and shopName are required" });
            }

           
            const storeResult = await Storescollection.insertOne(data);

       
            const prevUser = await usercollection.findOne({ email: data.email });
            const prevRole = prevUser?.role || "buyer";

            await usercollection.updateOne(
                { email: data.email },
                { $set: { role: "requested-seller" } }
            );

      
            const notificationData = {
                type: "role-update",
                email: data.email,
                createdAt: new Date(),
                updatedAt: new Date(),
                read: false,
                role: "requested-seller",
                message: `Seller request sent successfully! Please wait for admin approval".`
            };

            await notificationcollection.insertOne(notificationData);

            
            res.status(201).send({
                success: true,
                adminmessage:"A user is requesting to become a seller. Please review and check the Pending Approval page for status.",
                message: "Store added and role update notification sent successfully",
                insertedId: storeResult.insertedId
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({ success: false, message: err.message });
        }
    });


    return router;
};