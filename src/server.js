import express from "express";
import { MongoClient } from "mongodb";
import path from'path';

// create the express
const app = express();

// allows deployment
app.use(express.static(path.join(__dirname, '/build')));

// use the body parser
app.use(express.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

// GET request from the db
app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

// POST request for the article upvotes for the name
app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updateArtInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updateArtInfo);
  }, res);
});

// post comments on a specific article
app.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db.collection("articles").findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        '$set': {
          comments: articleInfo.comments.concat({ username, text }),
        },
      });
    const updateArtInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updateArtInfo);
  }, res);
});

// paths not caught above go here
app.get('*', (res, req) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

// listening on port 8000 when hit will log listening on port 8000
app.listen(8000, () => console.log("Listening on port 8000"));
