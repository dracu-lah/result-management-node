const studentDatatoDB = require("./studentDatatoDB");

const client = require("../utils/MongoClientConnection");

// this findSgpa functino is used to find the sgpa of a student
async function findSgpa(students) {
  try {
    await client.connect();
    console.log("Connected to MongoDB in findSgpa");
    const database = client.db("result_management");
    const credits_collection = database.collection("credits_data");

    const credits = await credits_collection.find().toArray();

    for (const student of students) {
      let totalCreditPoints = 0;
      let totalGradePoints = 0;
      const { courses } = student;
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
      await studentDatatoDB(student);
    }
  } catch (e) {
    console.error("Error in getFinalData: ", e);
  } finally { 
    await client.close();
  }
}
module.exports = findSgpa;
