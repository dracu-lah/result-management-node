require("dotenv").config();
const { MongoClient } = require("mongodb");

const mongoUser = process.env.MONGO_USER || "admin";
const mongoPassword = process.env.MONGO_PASSWORD || "admin123";
const mongoDatabase = process.env.MONGO_DATABASE || "testdb";

// const uri = `mongodb+srv://${mongoUser}:${mongoPassword}@cluster0.uspmcvc.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;
const localUri = `mongodb://${mongoUser}:${mongoPassword}@localhost:27017/${mongoDatabase}?authSource=admin`;
const client = new MongoClient(localUri, { useUnifiedTopology: true });

module.exports = client;
