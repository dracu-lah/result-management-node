const client = require("../utils/MongoClientConnection");

async function addCgpaToDB() {
  try {
    await client.connect();
    const database = client.db("result_management");
    const students_collection = database.collection("student_results");
    const final_students_collection = database.collection(
      "final_student_results"
    );

    const results = await students_collection.find().toArray();
    for (const result of results) {
      // check if there are semesters in the database
      if (!result.semesters || result.semesters.length === 0) {
        continue; // skip this student if there are no semesters
      }

      // code to find cgpa
      const { semesters, registerNumber } = result;
      const numSemesters = semesters.length;
      let sumSGPA = 0;

      for (let i = 0; i < numSemesters; i++) {
        sumSGPA += semesters[i].sgpa;
      }

      let cgpa = (sumSGPA / numSemesters).toFixed(2);

      await students_collection.updateOne(
        { registerNumber: registerNumber },
        { $set: { cgpa: cgpa } }
      );

      // adding aggregation to fix the ordering of semesters ;]

      try {
        await students_collection
          .aggregate([
            { $unwind: "$semesters" },
            { $sort: { "semesters.semester": 1 } },
            {
              $group: {
                _id: "$_id",
                registerNumber: { $first: "$registerNumber" },
                name: { $first: "$name" },
                cgpa: { $first: "$cgpa" },
                semesters: { $push: "$semesters" },
              },
            },
            { $out: "final_student_results" },
          ])
          .toArray();
      } catch (e) {
        console.error("*** Error in addCgpaDB aggregation ***", e);
        throw new Error("Error aggregating data");
      }
    }

    // gets the data after aggregating ;]
    const sortedData = await final_students_collection.find().toArray();

    return sortedData;
  } catch (e) {
    console.error("*** Error in addCgpaDB ***", e);
    throw new Error("Error adding CGPA to DB");
  } finally {
    await client.close();
  }
}

module.exports = addCgpaToDB;
