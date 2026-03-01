const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

module.exports = (notificationcollection) => {

    
    // router.get("/all-notifications", async (req, res) => {
    //     try {
    //         const notifications = await notificationcollection
    //             .find()
    //             .sort({ createdAt: -1 })
    //             .toArray();

    //         res.send(notifications);
    //     } catch (err) {
    //         console.log(err);
    //         res.status(500).send({ message: "Server error" });
    //     }
    // });




   
    router.get("/my-notifications/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const notifications = await notificationcollection
                .find({
                    $or: [
                        { sellerEmail: email },
                        { email: email }
                    ]
                })
                .sort({ createdAt: -1 })
                .toArray();

            res.send(notifications);
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });


    router.get("/unread-count/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const count = await notificationcollection.countDocuments({
                $or: [
                    { sellerEmail: email },
                    { email: email }
                ],
                read: false  
            });

            res.send({ unreadCount: count });

        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });



    router.patch("/update-read/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const result = await notificationcollection.updateMany(
                {
                    $or: [
                        { sellerEmail: email },
                        { email: email }
                    ]
                },
                {
                    $set: { read: true }
                }
            );

            res.send({
                message: "Notifications marked as read",
                modifiedCount: result.modifiedCount
            });

        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Server error" });
        }
    });



    // ✅ 4️⃣ Mark Notification As Read
    router.patch("/mark-as-read/:id", async (req, res) => {
        try {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid ID" });
            }

            await notificationcollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        read: true,
                        updatedAt: new Date()
                    }
                }
            );

            res.send({ message: "Notification marked as read" });

        } catch (err) {
            res.status(500).send({ message: "Server error" });
        }
    });


    // ✅ 5️⃣ Delete Notification
    router.delete("/:id", async (req, res) => {
        try {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid ID" });
            }

            const result = await notificationcollection.deleteOne({
                _id: new ObjectId(id)
            });

            if (result.deletedCount === 0) {
                return res.status(404).send({ message: "Notification not found" });
            }

            res.send({ message: "Notification deleted successfully" });

        } catch (err) {
            res.status(500).send({ message: "Server error" });
        }
    });

    return router;
};