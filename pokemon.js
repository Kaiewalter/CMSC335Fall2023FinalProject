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
app.use( express.static( "public" ) );
app.get("/", (request, response) => {
  response.render("index");
});

app.get("/apply", (request, response) => {
    response.render("application");
});

app.post("/apply", async (request, response) => {
  let {name, email, type, pokemon} = request.body;
  try {
      await client.connect();
      let variables = {name: name, email: email, type: type, pokemon: pokemon};
      await insertApplication(client, databaseAndCollection, individual);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
  response.render("confirmation", variables);
})

async function insertApplication(client, databaseAndCollection, newApplication) {
  const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApplication);
}

app.get("/displayType", (request, response) => {
  response.render("displayType");
});

app.post("/displayType", async (request, response) => {
  let target = request.body.type;
  let table = "<table border='1'><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody></tbody>";
  try {
      await client.connect();
      let filter = {type: {$e: target}};
      const cursor = await client.db(databaseAndCollection.db)
                      .collection(databaseAndCollection.collection)
                      .find(filter);
      const result = await cursor.toArray();
      for (let i = 0; i < result.length; i++) {
          table += '<tr><td>';
          table += result[i]['name'];
          table += '</td><td>'
          table += result[i]['type'];
          table += "</td>";
      }
      table += "</tbody></table><br>";
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
  const variables = {
      chart: table
  }
  response.render("typeChart", variables);
});

// Add more middleware functions here

app.listen(portNumber);
