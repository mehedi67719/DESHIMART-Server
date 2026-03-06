const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');




module.exports = (productscollection, notificationcollection, adminnotificationcollection) => {




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



    router.get("/search", async (req, res) => {
        try {
            const searchTerm = req.query.q;

            if (!searchTerm || searchTerm.length < 2) {
                return res.status(400).send({
                    message: "Search term must be at least 2 characters"
                });
            }


            const regex = new RegExp(searchTerm, 'i');


            const products = await productscollection
                .find({
                    status: "approved",
                    $or: [
                        { name: { $regex: regex } },
                        { description: { $regex: regex } },
                        { category: { $regex: regex } },
                        { brand: { $regex: regex } },
                        { tags: { $in: [regex] } }
                    ]
                })
                .project({
                    _id: 1,
                    name: 1,
                    price: 1,
                    oldPrice: 1,
                    image: 1,
                    images: 1,
                    category: 1,
                    brand: 1,
                    rating: 1,
                    discount: 1,
                    status: 1
                })
                .sort({
                    rating: -1,
                    sold: -1
                })
                .limit(10)
                .toArray();

            res.send(products);

        } catch (err) {
            console.error("Search error:", err);
            res.status(500).send({
                message: "Error searching products",
                error: err.message
            });
        }
    });


    router.get("/similar-products/:category", async (req, res) => {
        try {
            const category = req.params.category;
            console.log(category)

            const result = await productscollection
                .find({ category: category, status: "approved" })
                .sort({ sold: -1 })
                .limit(5)
                .toArray();

            res.send(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ message: "Server error" });
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


    router.get("/product-upload-summary", async (req, res) => {
        try {
            const products = await productscollection.find().toArray();

            const monthlyUpload = {};

            products.forEach(product => {
                if (!product.createdAt) return;

                const month = new Date(product.createdAt).toISOString().slice(0, 7);

                if (!monthlyUpload[month]) {
                    monthlyUpload[month] = 0;
                }

                monthlyUpload[month] += 1;
            });

            res.send({
                monthlyUpload,
                totalProducts: products.length
            });

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "server error" });
        }
    });




    router.get("/pending-approval", async (req, res) => {
        try {
            const result = await productscollection.find({ status: 'pending' }).toArray();
            res.send(result)
        }
        catch (err) {
            console.log(err)
            res.status(500).send({ message: "server error" })
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

            const objectId = new ObjectId(id);
            const product = await productscollection.findOne({ _id: objectId });

            if (!product) {
                return res.status(404).send({ message: "Product not found" });
            }
            await productscollection.deleteOne({ _id: objectId });



            const message = `deleted your product "${product.name}".`;
            const existingNotification = await notificationcollection.findOne({
                productId: objectId
            });



            if (existingNotification) {
                await notificationcollection.updateOne(
                    { productId: objectId },
                    {
                        $set: {
                            message: message,
                            status: "deleted",
                            updatedAt: new Date(),
                            read: false
                        }
                    }
                );
            } else {

                await notificationcollection.insertOne({
                    productId: objectId,
                    productName: product.name,
                    productImage: product.image,
                    sellerEmail: product.sellerEmail,
                    status: "deleted",
                    message: message,
                    createdAt: new Date(),
                    read: false
                });
            }

            res.send({
                message: "Product deleted and notification handled successfully"
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
            const insertedProduct = { ...data, _id: result.insertedId };


            await adminnotificationcollection.insertOne(
                {
                    productName: insertedProduct.name,
                    productImage: insertedProduct.image || "",
                    sellerEmail: insertedProduct.sellerEmail,
                    status: insertedProduct.status || "pending",
                    adminmessage: "A product is pending for your approval. Please check the Pending Approval page.",
                    createdAt: new Date(),
                    read: false,
                    type: "product-add"
                }
            )


            await notificationcollection.updateOne(
                { productId: insertedProduct._id },
                {
                    $set: {
                        productName: insertedProduct.name,
                        productImage: insertedProduct.image || "",
                        sellerEmail: insertedProduct.sellerEmail,
                        status: insertedProduct.status || "pending",
                        message: "Congratulations! Your product has been added successfully and is currently awaiting admin approval. Please wait patiently while our team reviews it.",
                        createdAt: new Date(),
                        read: false,
                        type: "product-add"
                    }
                },
                { upsert: true }
            );

            res.status(201).send({
                success: true,
                insertedId: result.insertedId,
                message: "Product added successfully and notification sent"
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



    router.get("/allproducts-status-summary", async (req, res) => {
        try {
            const result = await productscollection.aggregate([
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
                if (item._id === "approved") summary.approved = item.count;
                if (item._id === "rejected") summary.rejected = item.count;
                if (item._id === "pending") summary.pending = item.count;
            });

            res.send(summary);

        } catch (err) {
            console.log("Status Summary Error:", err);
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



    router.get("/top-sellers", async (req, res) => {
        try {
            const result = await productscollection.aggregate([
                {
                    $match: { status: "approved" }
                },
                {
                    $group: {
                        _id: "$sellerEmail",
                        shopName: { $first: "$shopName" },
                        totalSold: { $sum: "$sold" },
                        totalProducts: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalSold: -1 }
                },
                {
                    $limit: 5
                }
            ]).toArray();

            res.send(result);

        } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Failed to fetch top sellers" });
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

            const objectId = new ObjectId(id);


            const updateResult = await productscollection.updateOne(
                { _id: objectId },
                {
                    $set: {
                        status: status,
                        updatedAt: new Date()
                    }
                }
            );

            if (updateResult.matchedCount === 0) {
                return res.status(404).send({ message: "Product not found" });
            }


            const product = await productscollection.findOne({ _id: objectId });


            let message = "";

            if (status === "approved") {
                message = "Admin approved your product successfully.";
            } else if (status === "rejected") {
                message = "Admin rejected your product.";
            } else {
                message = `Product status updated to ${status}`;
            }


            await notificationcollection.updateOne(
                { productId: objectId },
                {
                    $set: {
                        productName: product.name,
                        productImage: product.image,
                        sellerEmail: product.sellerEmail,
                        status: status,
                        message: message,
                        createdAt: new Date(),
                        read: false
                    },

                },
                { upsert: true }
            );

            res.send({
                message: "Product status updated and notification handled successfully",
                modifiedCount: updateResult.modifiedCount
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



