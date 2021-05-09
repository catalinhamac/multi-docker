const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

//this app right here is esentially the object that's going to receive and response to any http requests that are coming or going back to the react application
const app = express();
//cors is short for cross origin resourse sharing and it's going to allow us to make requests from one domain that react app is going to be running on to a completely different domain or a different port that in this case that the express API is hosted on
app.use(cors());
//the body parser lbrary is going to parse incoming requests from react app and turned  the body of the post requests into JSON value that our express API can then very easily work with
app.use(bodyParser.json());

// Postgres Client Setup
//postgres is a sequel type database very similar to MySQL
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});
pgClient.on("error", () => console.log("Lost PG connection"));

//any time we connect to a sequel type datatbase we have to initially create at least one time a table that's going to store all the values. Column values with one column int his case a number of type intiger.
pgClient
  .query("CREATE TABLE IF NOT EXISTS values (number INT)")
  .catch((err) => console.log("pgClient.query errors", err));

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
//if we have a client that is publishing informations on radis we have to duplicate connection because when a connection is turned into a connection that's going to listen or subscribe or publish information it cannot be used for other purposes.
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values");

  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index, 10) > 40) {
    return res.status(422).send("Index to high");
  }
  //'nothing yet!' means that we haven't yet calculated the fib number for this index. This string will be replaced with the actual calculated value.
  redisClient.hset("values", index, "Nothing yet!");

  //message sent over that Worker process. It's going to wake up the worker process and say hey it's time to pull a new value out of redis and start calculating the fib value for it.
  redisPublisher.publish("insert", index);
  //add to postgres the new index that was just submitted
  pgClient.query("INSERT INTO values (number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log("Listening");
});
