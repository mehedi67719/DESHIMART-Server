const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();


module.exports = (usercollection) => {


    router.get('/all-users', async (req, res) => {
        try {
            const result = await usercollection.find().toArray();
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "server error" })
        }
    })

    router.post("/", async (req, res) => {
        try {
            const user = req.body;
            // console.log(user)

            const existingUser = await usercollection.findOne({ email: user.email });
            if (existingUser) {
                return res.status(200).send({
                    message: "User already exists",
                    user: existingUser,
                });
            }

            const result = await usercollection.insertOne(user)
        }
        catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send({ error: "Internal Server Error" });
        }
    })



    router.patch("/update-role", async (req, res) => {
        try {
            const { email, role } = req.body;

            if (!email || !role) {
                return res.status(400).send({ message: "Email and role are required" });
            }

            const filter = { email: email };
            const updatedDoc = {
                $set: {
                    role: role
                }
            };

            const result = await usercollection.updateOne(filter, updatedDoc);

            if (result.matchedCount === 0) {
                return res.status(404).send({ message: "User not found" });
            }

            res.send({
                message: "User role updated successfully",
                result
            });

        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Server error" });
        }
    });



    router.get("/", async (req, res) => {
        try {
            const email = req.query.email;
            const result = await usercollection.findOne({ email: email });
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "server error" })
        }
    })

    return router
}