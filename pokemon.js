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
  let {name, email, type} = request.body;
  let variables = {name: name, email: email, type: type};
  await insertApplication(variables);
  response.render("confirmation", variables);
})
async function insertApplication(newApp) {
  try {
    await client.connect();
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApp);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}



app.get("/displayType", (request, response) => {
  response.render("displayType");
});
app.post("/displayType", async (request, response) => {
  const type = request.body.type;
  const additionalRows = await findType(type);

  let table = "<table border='1'><thead><tr><th>Name</th><th>Email</th></tr></thead><tbody></tbody>";
  table += additionalRows;
  table += "</tbody></table><br>";
  const variables = {chart: table};
  response.render("typeChart", variables);
});
async function findType(type) {
  let additionalRows = "";
  try {
    await client.connect();
    const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
    const result = await cursor.toArray();
    for (let elem of result) {
      if (elem.type === type) {
        additionalRows += `<tr><td>${elem['name']}</td>`;
        additionalRows += `<td>${elem['email']}</td></tr>`;        
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
    return additionalRows;
  }
}



app.get("/displayFavorite", (request, response) => {
  response.render("displayFavorite");
})
app.post("/displayFavorite", (request, response) => {
  let pokemon = request.body.favorite;
  let info = "HERE IS INFORMATION PLACEHOLDER";
  const variables = {pokemon: pokemon, info: info};
  response.render("pokemonInfo", variables);
})



app.listen(portNumber);
