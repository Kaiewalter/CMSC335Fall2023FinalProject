// Defining all required packages and constants
const http = require("http");
const path = require("path");
const express = require("express");
const app = express();
let portNumber = 5000;
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 
const uri = "mongodb+srv://teamwork:cmsc335@cluster0.dddqwhd.mongodb.net/?retryWrites=true&w=majority"
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
process.stdin.setEncoding("utf8");

// Middleware functions start here
app.get("/", (request, response) => {
  response.render("index");
});

app.get("/apply", (request, response) => {
    const variables = { port: portNumber };
    response.render("application", variables);
});

// Add more middleware functions here

app.listen(portNumber);
