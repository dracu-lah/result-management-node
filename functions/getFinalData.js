const client = require("../utils/MongoClientConnection");
// Student results are displayed
async function getFinalData() {
  try {
    await client.connect();
    const database = client.db("result_management");
    const students_collection = database.collection("student_results");

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
  } catch (e) {
    console.error("*** Error in getFinalData ***: ", e);
  } finally {
    await client.close();
  }
}

module.exports = getFinalData;
