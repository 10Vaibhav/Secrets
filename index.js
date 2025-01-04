import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";

const saltRounds = 10;
const app = express();
const port = 3000;

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

app.get("/secrets", async (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {

    try{
      const result = await db.query("SELECT secret FROM users WHERE email = $1", [req.user.email]);
      console.log(result);
      const secret = result.rows[0].secret;

      if(secret){
        res.render("secrets.ejs", {secret: secret});
      } else{
        res.render("secrets.ejs", {secret: "Stranger things is my Favourite Web Series."});
      }
    }catch(err){
      console.log(err);
    }

  } else {
    res.redirect("/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async(req, res)=>{
  const secret = req.body.secret;
  console.log(req.user);
  try{

    await db.query("UPDATE users SET secret = $1 WHERE email = $2",[
      secret,
      req.user.email,
    ]);
    res.redirect("/secrets");
  }catch (err){
    console.log(err);
  }
})

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
  "local",
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

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log(profile);

      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);

        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email,password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          cb(null, newUser.rows[0]);
        } else {
          // Already existing user
          cb(null, result.rows[0]);
        }
      } catch (error) {
        cb(error);
      }
    }
  )
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
