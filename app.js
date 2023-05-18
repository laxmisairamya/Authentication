const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const db = null;
const initializeDbAndServe = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDbAndServe();
app.get("/user/", async (request, response) => {
  const getUserQuery = `
SELECT * FROM user`;
  const users = await db.all(getUserQuery);
  response.send(users);
});
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let checkUserDetails = `
  SELECT * FROM user WHERE username= '${username}';`;
  let userData = await db.get(checkUserDetails);
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      //checking the length of the password
      response.status(400);
      response.send("Password is too short");
    } else {
      /*If password length is greater than 5 then this block will execute*/
      let newUserDetails = await db.run(postNewUserQuery); //Updating data to the database
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    /*If the userData is already registered in the database then this block will execute*/
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  let userDetails = `
  SELECT * FROM user WHERE username='${username}';`;
  let userData = await db.get(userDetails);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordWatched = await bcrypt.compare(password, userData.password);
    if (isPasswordWatched === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userDetails = `
  SELECT * FROM user WHERE username='${username}';`;
  const userData = await db.get(userDetails);
  if (userData === undefined) {
    response.status(400);
    response.send("User Not Registered");
  } else {
    let checkUserPassword = await bcrypt.compare(
      oldPassword,
      userData.Password
    );
    if (checkUserPassword === true) {
      const lengthOfThePassword = newPassword.length;
      if (lengthOfThePassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedPasswordQuery = `
        UPDATE user
        SET password='${encryptedPassword}'
        WHERE username='${username}'
        `;
        await db.run(updatedPasswordQuery);
        response.status(200);
        response.send(" Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
