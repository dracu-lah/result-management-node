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
    // this function is used to store the student data to database
    async function studentDatatoDB({
      registerNumber,
      courses,
      semester,
      sgpa,
    }) {
      try {
        await client.connect();

        console.log("Connected to database for  sem push / set");
        // checks from db if semester exists or not
        const existingSemester = await students_collection
          .find({
            "semesters.semester": semester,
            registerNumber: registerNumber,
          })
          .toArray();
        if (existingSemester.length === 0) {
          // If the semester doesn't exist, push it to the semesters array
          console.log("Semester doesn't exist");

          const semesterObj = {
            semester: semester,
            courses: courses,
            sgpa: sgpa,
          };

          const pushObj = {
            $push: {
              semesters: semesterObj,
            },
          };

          await students_collection.updateOne(
            { registerNumber: registerNumber },
            pushObj
          );
        } else {
          // If the semester exists, update the results in the semester
          console.log("Semester exists");

          const updateObj = {
            $set: {
              "semesters.$[semester].sgpa": sgpa,
              "semesters.$[semester].courses": courses,
            },
          };

          const arrayFilter = {
            arrayFilters: [{ "semester.semester": semester }],
          };

          await students_collection.updateOne(
            { registerNumber: registerNumber },
            updateObj,
            arrayFilter
          );
        }
      } catch (e) {
        console.error("Error connecting to MongoDB", e);
      }
    }

    // this findSgpa functino is used to find the sgpa of a student
    function findSgpa(students) {
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
        // calls studentDatatoDB function
        studentDatatoDB(student);
      }
    }
    app.post("/", async (req, res) => {
      //   get post data of a student from students data
      const studentsData = req.body;
      // calls findSgpa function
      findSgpa(studentsData);

      res.send("Post sucessfully");
    });

    // Student results are displayed
    const getFinalData = async () => {
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
      return [finalData];
    };
    app.get("/api/results", async (req, res) => {
      // destructure final data
      const [finalData] = await getFinalData();
      res.send(finalData);
    });
    app.get("/", (req, res) => {
      res.send(
        "Post Page for the api (go to /api/results for getting the data)"
      );
    });
    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (e) {
    console.error("Error connecting to MongoDB", e);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
