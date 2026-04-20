const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: '172.16.50.131',
  user: 'mynotesuser',
  password: 'password123',
  database: 'mynotes',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.log("DB connection error:", err);
  } else {
    console.log("Connected to DB");
  }
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      res.send("Error");
    } else {
      res.send("User registered");
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
