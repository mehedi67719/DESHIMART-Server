const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

module.exports = (blogcollection) => {

  router.get("/categories", async (req, res) => {
    try {
      const categories = await blogcollection.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            name: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]).toArray();

      res.send(categories);

    } catch (err) {
      res.status(500).send({ message: "Failed to load categories" });
    }
  });




  router.get("/", async (req, res) => {
    try {

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const category = req.query.category;
      const search = req.query.search;

      const skip = (page - 1) * limit;

      let query = {};

      if (category && category !== "All") {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } }
        ];
      }

      const blogs = await blogcollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 })
        .toArray();

      const total = await blogcollection.countDocuments(query);

      res.send({
        blogs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

    } catch (err) {
      res.status(500).send({ message: "Failed to load blogs" });
    }
  });





router.get("/:id", async (req, res) => {
  try {

    const id = req.params.id;

    const blog = await blogcollection.findOne({
      _id: new ObjectId(id)
    });

    if (!blog) {
      return res.status(404).send({ message: "Blog not found" });
    }

    res.send(blog);

  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Error loading blog" });
  }
});


  return router;
};