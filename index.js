require("dotenv").config();
const { MongoClient } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
const port = process.env.PORT;
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDatabase = process.env.MONGO_DATABASE;

async function run() {
  const uri = `mongodb+srv://${mongoUser}:${mongoPassword}@cluster0.uspmcvc.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // your database interaction code here
    const database = client.db("result_management");
    const credits_collection = database.collection("credits_data");

    const credits = await credits_collection.find().toArray();
    const students_collection = database.collection("student_results");
    const student_results = await students_collection.find().toArray();

    async function hello({ registerNumber, courses, semester, sgpa }) {
      try {
        await client.connect();

        console.log("connected for sem push/set");
        // checks from db if semester exists or not
        const existingSemester = await students_collection
          .find({
            "semesters.semester": semester,
            registerNumber: registerNumber,
          })
          .toArray();
        const updateObj = {
          $set: {
            "semesters.$[semester].sgpa": sgpa,
            "semesters.$[semester].courses": courses,
          },
        };

        const arrayFilter = { "semester.semester": semester };

        if (existingSemester.length === 0) {
          // if the semester doesn't exists push it to the semesters array
          console.log("semester doesn't exist");

          await students_collection.updateOne(
            { registerNumber: registerNumber },
            {
              $push: {
                semesters: { semester: semester, courses: courses, sgpa: sgpa },
              },
            },
            function (err, result) {
              if (err) throw err;
              console.log(result);
              client.close();
            }
          );
        } else {
          // if the semester exists update the results in the semester
          console.log("semester exists");
          await students_collection.updateOne(
            { registerNumber: registerNumber },
            updateObj,
            { arrayFilters: [arrayFilter] },
            function (err, result) {
              if (err) throw err;
              console.log(result);
              client.close();
            }
          );
        }
      } catch (e) {
        console.error("Error connecting to MongoDB", e);
      }
    }

    app.post("/", async (req, res) => {
      const students = req.body;
      //   get post data of a student from students data
      for (const student of students) {
        let totalCreditPoints = 0;
        let totalGradePoints = 0;
        const { registerNumber, name, semester, courses } = student;
        //  get a course from courses
        for (const course of courses) {
          const [courseCode] = course.course.split("-");
          const creditPoint = credits.find(
            (credit) => credit.course_code === parseInt(courseCode)
          ).credit;
          const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0 };
          const gradePoint = gradePoints[course.grade];
          totalCreditPoints += creditPoint;
          totalGradePoints += creditPoint * gradePoint;
        }
        // sgpa calculation
        const sgpa = parseFloat(
          (totalGradePoints / totalCreditPoints).toFixed(2)
        );
        student["sgpa"] = sgpa;
        hello(student);
      }
      res.send("Post sucessfully");
    });

    // Student results are displayed
    app.get("/api/results", async (req, res) => {
      await client.connect();
      const database = client.db("result_management");
      const results = await students_collection.find().toArray();

      const finalData = [];

      results.map((std) => {
        // code to find cgpa
        const semesters = std.semesters;
        const numSemesters = semesters.length;
        let sumSGPA = 0;

        for (let i = 0; i < numSemesters; i++) {
          sumSGPA += semesters[i].sgpa;
        }

        let cgpa = (sumSGPA / numSemesters).toFixed(2);
        finalData.push({ ...std, cgpa: cgpa });
      });

      res.send(finalData);
    });

    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (e) {
    console.error("Error connecting to MongoDB", e);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
