const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connect } = require("mongoose");
const usersRoutes = require("./routes/usersRoutes");
const postsRoute = require("./routes/postsRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

// Routes
app.use("/api/users", usersRoutes);
app.use("/api/posts", postsRoute);

// Middlewares
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to the database"))
  .catch((error) => console.log("There was an error" + error));

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
