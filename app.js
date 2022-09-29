const express = require("express");
const redis = require("redis");
const date = require(__dirname + "/dates.js");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const client = redis.createClient({ url: "redis://@localhost:6379/1" });
client.connect();
client.on("connect", function () {
	console.log("Connected!");
});

app.get("/", async (req, res) => {
	day = date.getDay();

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

app.post("/del", async (req, res) => {
	const cinema = await client.lRange("movies", 0, -1);
	if (cinema.includes(req.body.box)) {
		client.lRem("movies", 0, req.body.box);
		res.redirect("/movies");
	} else {
		client.lRem("todoList", 0, req.body.box);
		res.redirect("/");
	}
});

app.post("/", (req, res) => {
	if (req.body.button === "movies") {
		const item = req.body.newItem;

		client.rPush("movies", item);

		res.redirect("/Movies");
	} else {
		const item = req.body.newItem;

		client.rPush("todoList", item);

		res.redirect("/");
	}
});

app.get("/Movies", async (req, res) => {
	const cinema = await client.lRange("movies", 0, -1);
	res.render("list", { title: "movies", newListItems: cinema });
});

// client.quit()

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
