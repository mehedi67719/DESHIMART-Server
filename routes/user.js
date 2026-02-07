const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();


module.exports = (usercollection) => {

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



    router.get("/",async(req,res)=>{
        try{
            const email=req.query.email;
            const result=await usercollection.findOne({email:email});
            res.send(result)
        }
        catch(err){
            console.log(err)
            res.status(500).send({message:"server error"})
        }
    })

    return router
}