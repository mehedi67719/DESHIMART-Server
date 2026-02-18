const express = require("express");

module.exports = (chatcollection, io, usercollection) => {
    const router = express.Router();


    router.post("/send", async (req, res) => {
        try {
            const { senderId, receiverId, message } = req.body;

            const newMessage = {
                senderId,
                receiverId,
                message,
                createdAt: new Date()
            };

            const result = await chatcollection.insertOne(newMessage);

     
            io.to(receiverId).emit("receiveMessage", newMessage);

            res.send(result);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server Error" });
        }
    });


    
    router.get("/:user1/:user2", async (req, res) => {
        try {
            const { user1, user2 } = req.params;

            const messages = await chatcollection.find({
                $or: [
                    { senderId: user1, receiverId: user2 },
                    { senderId: user2, receiverId: user1 }
                ]
            }).sort({ createdAt: 1 }).toArray();

            res.send(messages);

        } catch (err) {
            res.status(500).send({ message: "Server Error" });
        }
    });



    io.on("connection", (socket) => {
        console.log("User Connected:", socket.id);

        socket.on("joinRoom", (userId) => {
            socket.join(userId);
        });

        socket.on("disconnect", () => {
            console.log("User Disconnected");
        });
    });

    return router;
};
