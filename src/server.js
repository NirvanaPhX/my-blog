const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, "/build")));
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const withDB = async (operations, res) => {
  const client = await MongoClient.connect("mongodb://localhost:27017");
  try {
    const db = client.db("my-blog");

    await operations(db);
  } catch (err) {
    res.status(500).json({ message: "Error connecting to db", err });
  } finally {
    client.close();
  }
};
app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $inc: { upvotes: 1 },
      }
    );

    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticle);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  withDB(async (db) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    const article = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { comments: article.comments.concat({ username, text }) } }
      );

    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticle);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => {
  console.log(`Listening on port ${port}`);
});
