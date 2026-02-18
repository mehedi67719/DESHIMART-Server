const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');



module.exports = (productscollection) => {




    router.get("/top-categories", async (req, res) => {
        try {

            const topCategories = await productscollection.aggregate([
                { $match: { status: "approved" } },
                {
                    $group: {
                        _id: "$category",
                        totalSold: { $sum: "$sold" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 3 }
            ]).toArray();

            const categoryNames = topCategories.map(cat => cat._id);

            const result = await Promise.all(
                categoryNames.map(async (category) => {
                    const products = await productscollection.find({
                        category,
                        status: "approved"
                    })
                        .sort({ sold: -1 })
                        .limit(5)
                        .project({
                            name: 1,
                            price: 1,
                            oldPrice: 1,
                            image: 1,
                            isNew: 1,
                            sold: 1,
                            rating: 1,
                            discount: 1,
                            sellerEmail: 1
                        })
                        .toArray();

                    return {
                        category,
                        products
                    };
                })
            );

            res.send(result);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Error fetching top categories" });
        }
    });





    router.get("/all-products", async (req, res) => {
        try {
            const result = await productscollection.find().toArray();
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "server error" })
        }
    })




    router.get("/pending-approval",async(req,res)=>{
        try{
            const result=await productscollection.find({status:'pending'}).toArray();
            res.send(result)
        }
        catch(err){
            console.log(err)
            res.status(500).send({message:"server error"})
        }
    })




    router.get("/top-rating", async (req, res) => {
        try {
            const products = await productscollection
                .find(
                    {
                        rating: { $exists: true },
                        status: "approved"
                    },
                    {
                        projection: {
                            name: 1,
                            price: 1,
                            oldPrice: 1,
                            image: 1,
                            isNew: 1,
                            sold: 1,
                            rating: 1,
                            discount: 1,
                            category: 1,
                            sellerEmail: 1
                        }
                    }
                )
                .sort({ rating: -1 })
                .limit(5)
                .toArray();

            res.send(products);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Error fetching top rating products" });
        }
    });





    router.get("/", async (req, res) => {
        try {
            const limit = 8;
            const cursor = req.query.cursor;
            const category = req.query.category;
            const brand = req.query.brand;
            const priceRange = req.query.priceRange;

            let query = { status: "approved" };

            if (category) {
                query.category = category;
            }

            if (brand) {
                query.brand = brand;
            }

            if (priceRange) {
                const [min, max] = priceRange.split(",").map(Number);
                query.price = { $gte: min, $lte: max };
            }



            if (cursor) {
                query._id = { $gt: new ObjectId(cursor) };
            }


            const products = await productscollection
                .find(query, {
                    projection: {
                        name: 1,
                        price: 1,
                        oldPrice: 1,
                        image: 1,
                        isNew: 1,
                        sold: 1,
                        rating: 1,
                        discount: 1,
                        sellerEmail: 1
                    }
                }
                )
                .sort({ _id: 1 })
                .limit(limit)
                .toArray();

            res.send(products);
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Error fetching products" });
        }
    });


    router.get("/my-products", async (req, res) => {
        try {
            const email = req.query.email;

            const result = await productscollection
                .find({ sellerEmail: email })
                .toArray();

            res.send(result);
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: err.message });
        }
    });


    router.delete("/:id", async (req, res) => {
        try {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid product ID" });
            }

            const result = await productscollection.deleteOne({
                _id: new ObjectId(id)
            });

            if (result.deletedCount === 0) {
                return res.status(404).send({ message: "Product not found" });
            }

            res.send({
                message: "Product deleted successfully",
                deletedCount: result.deletedCount
            });
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: err.message });
        }
    });


    router.put("/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const updates = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid product ID" });
            }
            delete updates._id;


            updates.updatedAt = new Date();

            const result = await productscollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updates }
            );

            if (result.matchedCount === 0) {
                return res.status(404).send({ message: "Product not found" });
            }

            res.send({
                message: "Product updated successfully",
                modifiedCount: result.modifiedCount
            });
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: err.message });
        }
    });






    router.post("/", async (req, res) => {
        try {
            const data = req.body;

            if (!data) {
                return res.status(400).send({ message: "Product data is required" });
            }

            const result = await productscollection.insertOne(data);

            res.status(201).send({
                success: true,
                insertedId: result.insertedId
            });

        } catch (err) {
            console.error(err);
            res.status(500).send({
                success: false,
                message: "Failed to post product data"
            });
        }
    });





    router.get("/hotproducts", async (req, res) => {
        try {
            const { cursor } = req.query;
            let query = {
                status: "approved",
                discount: { $gte: 15 }
            };





            if (cursor) {
                query._id = { $lt: new ObjectId(cursor) }
            }


            const result = await productscollection
                .find(query)
                .sort({ _id: -1 })
                .limit(10)
                .toArray();


            res.send(result)



        }
        catch (err) {
            console.log(err)
            res.status(500).send({ error: "Server Error" })
        }
    })



    router.get("/status-summary", async (req, res) => {
        try {
            const email = req.query.sellerEmail;

            if (!email) {
                return res.status(400).send({ message: "Email is required" });
            }

            const result = await productscollection.aggregate([
                {
                    $match: { sellerEmail: email }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            const summary = {
                approved: 0,
                rejected: 0,
                pending: 0
            };

            result.forEach(item => {
                summary[item._id] = item.count;
            });

            res.send(summary);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Failed to fetch status summary" });
        }
    });



    router.get("/collection", async (req, res) => {
        try {
            const limit = 10;
            const cursor = req.query.cursor;
            const type = req.query.type;


            let query = {
                status: "approved"
            };


            if (type === "new") query.isNew = true;
            if (type === "sale") query.isNew = false;
            if (type === "hot") query.discount = { $gte: 15 };


            if (cursor) query._id = { $gt: new ObjectId(cursor) };

            const products = await productscollection.find(query, {
                projection: {
                    name: 1,
                    price: 1,
                    oldPrice: 1,
                    image: 1,
                    isNew: 1,
                    sold: 1,
                    rating: 1,
                    discount: 1,
                    sellerEmail: 1,
                    status: 1
                }
            })
                .sort({ _id: 1 })
                .limit(limit)
                .toArray();

            const nextCursor = products.length === limit
                ? products[products.length - 1]._id
                : null;

            res.send({ products, nextCursor });
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Error fetching Collection" });
        }
    });





    router.post("/byIds", async (req, res) => {
        try {
            const { productIds } = req.body;

            if (!productIds || !Array.isArray(productIds)) {
                return res.status(400).send({ message: "Invalid product IDs" });
            }

            const objectIds = productIds.map(id => new ObjectId(id));

            const products = await productscollection.find({
                _id: { $in: objectIds }
            }).toArray();

            res.send(products);
        } catch (err) {
            console.error(err);
            res.status(500).send({ message: "Error fetching products" });
        }
    });





    router.patch("/status/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const { status } = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid product ID" });
            }

            if (!status) {
                return res.status(400).send({ message: "Status is required" });
            }

            const result = await productscollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: status,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).send({ message: "Product not found" });
            }

            res.send({
                message: "Product status updated successfully",
                modifiedCount: result.modifiedCount
            });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Failed to update product status" });
        }
    });








    router.get("/:id", async (req, res) => {
        try {
            const id = req.params.id;


            const product = await productscollection.find({ _id: new ObjectId(id) }).toArray();
            res.send(product)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "Failed to fetch singleproducts" })
        }
    })














    return router;
}



