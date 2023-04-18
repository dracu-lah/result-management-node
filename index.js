require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const getFinalData = require("./functions/getFinalData");
const findSgpa = require("./functions/findSgpa");

const app = express();
app.use(bodyParser.json());
app.use(cors());
const port = process.env.PORT;

app.post("/", (req, res) => {
  //   get post data of a student from students data
  const studentsData = req.body;
  // calls findSgpa function
  findSgpa(studentsData);

  res.send("Post sucessfully");
});

app.get("/api/results", async (req, res) => {
  // destructure final data

  const [finalData] = await getFinalData();

  res.send(finalData);
});
app.get("/", (req, res) => {
  res.send("Post Page for the api (go to /api/results for getting the data)");
});
app.listen(port, () => console.log(`Server started on port ${port}`));
