const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();


module.exports = (usercollection, notificationcollection) => {


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



    router.get('/all-users-summary', async (req, res) => {
        try {
            const users = await usercollection.find().toArray();

            const monthlySummary = {};
            users.forEach(user => {
                if (!user.createdAt) return;

                const month = new Date(user.createdAt).toISOString().slice(0, 7);

                if (!monthlySummary[month]) {
                    monthlySummary[month] = {
                        totalUsers: 0,
                        totalBuyers: 0,
                        totalSellers: 0
                    };
                }

                monthlySummary[month].totalUsers += 1;
                if (user.role === "buyer") {
                    monthlySummary[month].totalBuyers += 1;
                }

                if (user.role === "admin" || user.role === "seller") {
                    monthlySummary[month].totalSellers += 1;
                }
            });

            res.send({
                monthlySummary
            });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "server error" });
        }
    });



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

            const user = await usercollection.findOne({ email: email });

            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }

            const oldRole = user.role;

         
            await usercollection.updateOne(
                { email: email },
                {
                    $set: {
                        role: role,
                        updatedAt: new Date()
                    }
                }
            );

            const message = `changed your role from "${oldRole}" to "${role}".`;
            await notificationcollection.updateOne(
                { email: email, type: "role-update" },
                {
                    $set: {
                        email: email,
                        role: role,
                        message: message,
                        type: "role-update",
                        read: false,
                        createdAt: new Date()
                    },
                    
                },
                { upsert: true }
            );

            res.send({
                message: "User role updated and notification handled successfully"
            });

        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "Server error" });
        }
    });

    


    router.get("/pending-user", async (req, res) => {
        try {
            const result = await usercollection.find({ role: "requested-seller" }).toArray();
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "server error" })
        }
    })



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