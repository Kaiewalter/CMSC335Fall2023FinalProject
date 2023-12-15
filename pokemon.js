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
  let variables = {name: name, email: email, type: type, favorite: pokemon};
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
  const {type, pokemon, filter} = request.body;
  let additionalRows = "";
  additionalRows = await find(type, pokemon, filter);
  let table = "<table border='1'><thead><tr><th>Name</th><th>Email</th><th>Favorite Type</th><th>Favorite Pokemon</th></tr></thead><tbody>";
  table += additionalRows;
  table += "</tbody></table><br>";
  const variables = {chart: table, filter: filter.toLowerCase()};
  response.render("typeChart", variables);
});
async function find(type, pokemon, filter) {
  let additionalRows = "";
  try {
    await client.connect();
    const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
    const result = await cursor.toArray();
    for (let elem of result) {
      if (filter === "Type" && elem.type === type) {
        additionalRows += `<tr><td>${elem['name']}</td>`;
        additionalRows += `<td>${elem['email']}</td>`;
        additionalRows += `<td>${elem['type']}</td>`;
        additionalRows += `<td>${elem['favorite']}</td></tr>`;
      } else if (filter === "Pokemon" && elem.favorite === pokemon) {
        additionalRows += `<tr><td>${elem['name']}</td>`;
        additionalRows += `<td>${elem['email']}</td>`;
        additionalRows += `<td>${elem['type']}</td>`;
        additionalRows += `<td>${elem['favorite']}</td></tr>`;
      } else if (filter === "Both" && elem.type === type && elem.favorite === pokemon) {
        additionalRows += `<tr><td>${elem['name']}</td>`;
        additionalRows += `<td>${elem['email']}</td>`;
        additionalRows += `<td>${elem['type']}</td>`;
        additionalRows += `<td>${elem['favorite']}</td></tr>`;
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
app.post("/displayFavorite", async (request, response) => {
  let pokemon = request.body.favorite;
  if (pokemon === "") {
    let email = request.body.email;
    pokemon = await findFavorite(email);
  }

  let formattedPokemon = pokemon.toLowerCase()
  let url = `https://pokeapi.co/api/v2/pokemon/${formattedPokemon}/`;
  let info = "";
  let result = await fetch(url);
  if (result.status === 404) {
    info += "Pokemon not found, please try again with a valid pokemon!<br>";
    const variables = {pokemon: pokemon, info: info};
    response.render("pokemonInfo", variables);
  } else if (pokemon === "") {
    info += "Either invalid email provided or pokemon not provided<br>";
    const variables = {pokemon: "*POKEMON NOT FOUND*", info: info};
    response.render("pokemonInfo", variables);
  } else {
    let json = await result.json();
    info += `ID: ${json.id}<br>`;
    info += `Name: ${json.name}<br>`;
    info += `Height: ${json.height}<br>`;
    info += `Weight: ${json.weight}<br>`;
    info += `Base Experience: ${json.base_experience}<br>`;
    info += `Order: ${json.order}<br>`;  
    const variables = {pokemon: pokemon, info: info};
    response.render("pokemonInfo", variables);
  }
})
async function findFavorite(email) {
  let favorite = "";
  try {
    await client.connect();
    const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
    const result = await cursor.toArray();
    for (let elem of result) {
      if (elem.email === email) {
        favorite = elem.favorite;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
    return favorite;
  }
}

app.listen(portNumber);
