const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

module.exports = (adminnotificationcollection, usercollection) => {

  
    router.get("/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const user = await usercollection.findOne({ email: email });

            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }

           
            if (user.role !== "admin") {
                return res.status(403).send({ message: "Access denied. Admin only." });
            }

            const adminNotifications = await adminnotificationcollection
                .find()
                .sort({ createdAt: -1 })
                .toArray();

            res.send(adminNotifications);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });

  
    router.get("/count/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const user = await usercollection.findOne({ email });

            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }

         
            if (user.role !== "admin") {
                return res.status(403).send({ message: "Access denied. Admin only." });
            }

            const count = await adminnotificationcollection.countDocuments({ read: false });

            res.send({ unreadCount: count });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });



    router.patch("/update-read/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const user = await usercollection.findOne({ email });

            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }

           
            if (user.role !== "admin") {
                return res.status(403).send({ message: "Access denied. Admin only." });
            }

            
            const result = await adminnotificationcollection.updateMany(
                { read: false },
                { $set: { read: true } }
            );

            res.send({ 
                message: "All notifications marked as read", 
                modifiedCount: result.modifiedCount 
            });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });


    return router;
};