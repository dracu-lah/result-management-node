require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const findSgpa = require("./functions/findSgpa");
const addCgpaToDB = require("./functions/addCgpaToDB");
const findUser = require("./functions/findUser");
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
const port = process.env.PORT;

app.post("/", async (req, res) => {
  //   get post data of a student from students data
  const studentsData = req.body.result;
  // calls findSgpa function
  await findSgpa(studentsData);
  res.send("Post sucessfully");
});

app.post("/auth/users/", (req, res) => {
  const { username, password } = req.body;
  findUser(req, res, username, password);
});

app.get("/api/results", async (req, res) => {
  // destructure final data

  res.send(await addCgpaToDB());
});
app.get("/", (req, res) => {
  res.send("Post Page for the api (go to /api/results for getting the data)");
});
app.listen(port, () => console.log(`Server started on port ${port}`));
