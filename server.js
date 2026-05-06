const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');

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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.send("All fields are required");
  }

  const hashedPassword = hashPassword(password);

  const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) {
      return res.send("Registration failed");
    } else {
      return res.send("User registered successfully");
    }
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.send("Email and password are required");
  }

  const hashedPassword = hashPassword(password);

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, hashedPassword], (err, result) => {
    if (err) {
      return res.send("Database error");
    } else if (result.length > 0) {
      return res.send("Login successful");
    } else {
      return res.send("Invalid login");
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
