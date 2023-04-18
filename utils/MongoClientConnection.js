require("dotenv").config();
const { MongoClient } = require("mongodb");

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDatabase = process.env.MONGO_DATABASE;

const uri = `mongodb+srv://${mongoUser}:${mongoPassword}@cluster0.uspmcvc.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useUnifiedTopology: true });

module.exports = client;
