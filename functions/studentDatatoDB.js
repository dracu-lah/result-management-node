const client = require("../utils/MongoClientConnection");

// this function is used to store the student data to database
async function studentDatatoDB({ registerNumber, courses, semester, sgpa }) {
  try {
    await client.connect();
    const database = client.db("result_management");
    const students_collection = database.collection("student_results");
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
    console.error("*** Error in StudentDatatoDB ***", e);
  } 
  finally {
    await client.close();
  }
}

module.exports = studentDatatoDB;
