const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

module.exports = (chatcollection, io, usercollection) => {


    router.post("/list", async (req, res) => {
        try {
            const list = req.body;

            const existingChat = await chatcollection.findOne({
                productId: list.productId,
                buyerEmail: list.buyerEmail
            });

            if (existingChat) {
                return res.status(200).send({
                    message: "Chat already exists",
                    chatId: existingChat._id
                });
            }

            const result = await chatcollection.insertOne({
                ...list,
                createdAt: new Date(),
                lastMessageTime: new Date(),
                chat: [],
                seenBy: [],
                unreadCount: 0
            });

            res.status(201).send({
                message: "Chat created successfully",
                chatId: result.insertedId
            });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });


    router.get("/list", async (req, res) => {
        try {
            const userEmail = req.query.email;
            if (!userEmail) return res.status(400).send({ message: "Email is required" });

            const result = await chatcollection
                .find({
                    $or: [{ buyerEmail: userEmail }, { sellerEmail: userEmail }]
                })
                .sort({ lastMessageTime: -1 })
                .toArray();

            res.send(result);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });


    router.post("/send-message", async (req, res) => {
        try {
            const { chatId, useremail, messageText } = req.body;
            if (!chatId || !useremail || !messageText)
                return res.status(400).send({ message: "All fields required" });

            const newMessage = {
                sender: useremail,
                messageText,
                time: new Date()
            };

            const chat = await chatcollection.findOne({ _id: new ObjectId(chatId) });
            if (!chat) return res.status(404).send({ message: "Chat not found" });

            const receiverEmail = chat.buyerEmail === useremail ? chat.sellerEmail : chat.buyerEmail;

            const result = await chatcollection.updateOne(
                { _id: new ObjectId(chatId) },
                {
                    $push: { chat: newMessage },
                    $set: { lastMessage: messageText, lastMessageTime: new Date() },
                    $pull: { seenBy: useremail }, 
                    $inc: { unreadCount: 1 }     
                }
            );

          
            io.to(chatId).emit("new-message", { chatId, newMessage });

            res.send({ success: true, newMessage });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });


    router.put("/mark-seen/:chatId", async (req, res) => {
        try {
            const { chatId } = req.params;
            const { userEmail } = req.body;


            console.log(chatId,userEmail)

            if (!chatId || !userEmail)
                return res.status(400).send({ message: "ChatId and userEmail required" });

            const chat = await chatcollection.findOne({ _id: new ObjectId(chatId) });
            if (!chat) return res.status(404).send({ message: "Chat not found" });

         
            const alreadySeen = chat.seenBy.includes(userEmail);

            if (!alreadySeen) {
                await chatcollection.updateOne(
                    { _id: new ObjectId(chatId) },
                    {
                        $addToSet: { seenBy: userEmail },
                        $set: { unreadCount: 0 } 
                    }
                );

          
                io.to(chatId).emit("message-seen", { chatId, userEmail });
            }

            res.send({ success: true, chatId, userEmail });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Server error" });
        }
    });

    return router;
};