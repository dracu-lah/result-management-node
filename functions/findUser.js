const client = require("../utils/MongoClientConnection");

async function findUser(req, res, username, password) {
  try {
    await client.connect();
    const database = client.db("result_management");

    const user_collection = database.collection("users");
    const existingUser = await user_collection
      .find({ username, password })
      .toArray();
    if (existingUser.length === 0) {
      res.status(404).json({ error: "User not found" });
    } else {
      res.json(existingUser[0]);
    }
  } catch (e) {
    console.error("*** Error in findUser ***", e);
  }
}

module.exports = findUser;
