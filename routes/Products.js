const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');



module.exports = (productscollection) => {




    router.get("/top-categories", async (req, res) => {
        try {


            const topCategories = await productscollection.aggregate([
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

                    const products = await productscollection.find({ category })
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
                            discount: 1
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




    router.get("/top-rating", async (req, res) => {
        try {

            const products = await productscollection
                .find(
                    { rating: { $exists: true } }, 
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
                            category:1
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

            let query = {};

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
                        discount: 1
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






    router.get("/hotproducts", async (req, res) => {
        try {
            const { cursor } = req.query;
            let query = {
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





    router.get("/collection", async (req, res) => {
        try {
            const limit = 10;
            const cursor = req.query.cursor;
            const type = req.query.type;

            let query = {};

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
                    discount: 1
                }
            })
                .sort({ _id: 1 })
                .limit(limit)
                .toArray();

            const nextCursor = products.length === limit
                ? products[products.length - 1]._id
                : null;

            res.send({ products, nextCursor });
        }
        catch (err) {
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



