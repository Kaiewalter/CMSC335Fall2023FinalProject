const http = require("http");
const path = require("path");
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
var portNumber;
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

const uri = "mongodb+srv://instructor:project6@cluster0.cujvsvc.mongodb.net/?retryWrites=true&w=majority"

/* Our database and collection */
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");

if (process.argv.length != 3) {
    process.stdout.write(`Usage ${process.argv[1]} portNumber`);
    process.exit(1);
}

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

app.get("/", (request, response) => {
  /* Generating the HTML using index template */
  response.render("index");
});
portNumber = process.argv[2];
app.listen(portNumber);
console.log(`Web server is running at http://localhost:${portNumber}`);

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);

process.stdin.setEncoding("utf8"); /* encoding */

process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
let dataInput = process.stdin.read();
if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
        process.stdout.write("Shutting down the server\n");
        process.exit(0);
    } else {
        process.stdout.write("Invalid command: " + command + "\n");
    }
    process.stdout.write(prompt);
    process.stdin.resume();
    }
});

app.get("/apply", (request, response) => {
    /* Generating the HTML using index template */
    const variables = {
        port: process.argv[2]
    }
    response.render("application", variables);
});

app.use(bodyParser.urlencoded({extended:false}));
app.post("/apply", async (request, response) => {
    let {name, email, GPA, backgroundInformation} = request.body;
    try {
        await client.connect();
        let individual = {name: name, emailAddress: email, GPA: GPA, backgroundInformation: backgroundInformation};
        await insertApplication(client, databaseAndCollection, individual);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    const variables = {
        name: name,
        email: email,
        GPA: GPA,
        backgroundInformation: backgroundInformation,
        date: new Date()
    }
    response.render("confirmation", variables);
})

async function insertApplication(client, databaseAndCollection, newApplication) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApplication);
}

app.get("/reviewApplication", (request, response) => {
    /* Generating the HTML using index template */
    const variables = {
        port: process.argv[2]
    }
    response.render("reviewApp", variables);
});

app.post("/reviewApplication", async (request, response) => {
    let email = request.body.email;
    try {
        await client.connect();
        let filter = {emailAddress: email};
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);
    
       if (result) {
           const variables = {
            name: result['name'],
            email: result['emailAddress'],
            GPA: result['GPA'],
            backgroundInformation: result['backgroundInformation'],
            date: new Date()
           }
           response.render("confirmation", variables);
        } else {
            const variables = {
                name: 'N/A',
                email: 'N/A',
                GPA: 'N/A',
                backgroundInformation: 'N/A',
                date: new Date()
               }
            response.render("confirmation", variables);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
}
}
);


app.get("/adminGPA", (request, response) => {
    /* Generating the HTML using index template */
    const variables = {
        port: process.argv[2]
    }
    response.render("adminGPA", variables);
});

app.post("/adminGPA", async (request, response) => {
    let target = request.body.GPA;
    let table = "<table border='1'><thead><tr><th>Name</th><th>GPA</th></tr></thead><tbody></tbody>";
    try {
        await client.connect();
        let filter = {GPA: {$gte: target}};
        const cursor = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .find(filter);
        const result = await cursor.toArray();
        for (let i = 0; i < result.length; i++) {
            table += '<tr><td>';
            table += result[i]['name'];
            table += '</td><td>'
            table += result[i]['GPA'];
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
    response.render("gpaDisplay", variables);
});

app.get("/adminRemove", (request, response) => {
    /* Generating the HTML using index template */
    const variables = {
        port: process.argv[2]
    }
    response.render("adminRemove", variables);
});

app.post("/adminRemove", async (request, response) => {
    let variables = {}
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        let total = result.deletedCount;
        variables = {
           total: total
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    response.render("removalConfirmation", variables);
});