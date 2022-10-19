const express = require("express");
const redis = require("redis");
const date = require(__dirname + "/dates.js");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

const client = redis.createClient({ url: "redis://@localhost:6379/1" });
let day = date.getDay();
client.connect();
client.on("connect", function () {
  console.log("Connected!");
});

app.get("/", async (req, res) => {
  const result = await client.lRange("todoList", 0, -1);

  if (result.length === 0) {
    const multi = client.multi();
    const todoList = ["Wake Up", "Brush My Teeth", "Go to work"];
    todoList.forEach((todo) => {
      multi.rPush("todoList", todo);
    });
    multi.exec();
    res.redirect("/");
  } else {
    res.render("list", { title: day, newListItems: result });
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const itExists = await client.exists(customListName);

  if (itExists) {
    const List = await client.lRange(customListName, 0, -1);
    res.render("list", { title: customListName, newListItems: List });
  } else {
    const multi = client.multi();
    const customList = ["Have fun!", "Play Games!", "Watch Movies!"];
    customList.forEach((item) => {
      multi.rPush(customListName, item);
    });
    multi.exec();
    res.render("list", { title: customListName, newListItems: customList });
  }
});

app.post("/del", async (req, res) => {
  const listName = req.body.listName;

  if (listName === day) {
    client.lRem("todoList", 0, req.body.box);
    res.redirect("/");
  } else {
    client.lRem(listName, 0, req.body.box);
    res.redirect("/" + listName);
  }
});

app.post("/", (req, res) => {
  if (req.body.button === day) {
    const item = req.body.newItem;

    client.rPush("todoList", item);

    res.redirect("/");
  } else {
    const item = req.body.newItem;

    client.rPush(req.body.button, item);

    res.redirect("/" + req.body.button);
  }
});

// client.quit();
