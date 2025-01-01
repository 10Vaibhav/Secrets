import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

dotenv.config();

const db = new pg.Client({
  user: process.env.user,
  host: process.env.host,
  database: process.env.database,
  password: process.env.password,
  port: process.env.port,
});

db.connect();

async function getUsers() {
  const result = await db.query("Select * from users");

  return result.rows;
}

const saltRounds = 10;
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.secret,
    resave: process.env.resave,
    saveUninitialized: process.env.saveUninitialized,
    cookie: {
      // maxAge : 1000 * 60 * 60 * 24,
      maxAge: 1000 * 60 * 60,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/secrets", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.log("Error Occur While Hashing : " + err);
      } else {
        console.log("Hashed Password : ", hash);

        const result = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
          [username, hash]
        );

        const user = result.rows[0];

        req.login(user, (err) => {
          console.log(err);
          res.redirect("/secrets");
        });
      }
    });
  } catch (error) {
    res.send("user already registered");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const users = await getUsers();
      let user = users.find((user) => user.email == username);

      if (user) {
        const storedHashPassword = user.password;

        bcrypt.compare(password, storedHashPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("user not found !!");
      }
    } catch (error) {
      return cb(error);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});





