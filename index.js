import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: process.env.user,
  host: process.env.host,
  database: process.env.database,
  password: process.env.password,
  port : process.env.port
})

db.connect();

async function getUsers(){

  const result = await db.query("Select * from users");

  return result.rows
}

let users = await getUsers();


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {

  const username = req.body.username;
  const password  = req.body.password;

  try{
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [username,password]);
    res.render("secrets.ejs");
  }catch (error){
    res.send("user already registered");
  }
}
);

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password  = req.body.password;

  let UserExist = 0;

  users = await getUsers();
  UserExist = users.find((user) => user.email == username)

  if(UserExist){

    if(UserExist.password == password){
      res.render("secrets.ejs");
    }else{
      res.send("Password is Wrong !!");
    }

  }else{
    res.send("user not found");
  }

});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
