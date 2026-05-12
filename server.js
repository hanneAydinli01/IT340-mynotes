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
    console.log("DB connection error:");
    console.log(err);
  } else {
    console.log("Connected to DB");
  }
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = hashPassword(password);

  const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) {
      res.send("Error");
    } else {
      res.send("User registered");
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
    }

    if (result.length > 0) {
      return res.redirect('http://172.16.50.132/dashboard.html');
    } else {
      return res.send("Invalid login");
    }
  });
});

app.post('/add-note', (req, res) => {
  const { user_email, title, content } = req.body;

  if (!user_email || !title || !content) {
    return res.send("All note fields are required");
  }

  const sql = "INSERT INTO notes (user_email, title, content) VALUES (?, ?, ?)";

  db.query(sql, [user_email, title, content], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Note could not be saved");
    } else {
      return res.send("Note saved successfully");
    }
  });
});

app.get('/notes', (req, res) => {
  const sql = "SELECT * FROM notes ORDER BY created_at DESC";

  db.query(sql, (err, result) => {
    if (err) {
      return res.send("Could not load notes");
    }

    let notesHtml = `
      <html>
      <head>
        <title>Saved Notes</title>
        <style>
          body {
            font-family: Arial;
            background-color: #f8f5ef;
            padding: 40px;
          }

          .note-box {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
            border: 1px solid #ddd;
          }

          h2 {
            color: #6b7d95;
          }
        </style>
      </head>
      <body>

      <h1>Saved Notes</h1>
    `;

    result.forEach(note => {
      notesHtml += `
        <div class="note-box">
          <h2>${note.title}</h2>
          <p><strong>Email:</strong> ${note.user_email}</p>
          <p>${note.content}</p>
          <small>${note.created_at}</small>
<a href="/edit-note/${note.id}" 
style="
background:#9fd2f5;
color:white;
padding:8px 14px;
border-radius:8px;
text-decoration:none;
margin-right:8px;
">
Edit
</a>

<br><br>
<a href="/delete-note/${note.id}" 
style="
background:#d97c7c;
color:white;
padding:8px 14px;
border-radius:8px;
text-decoration:none;
">
Delete
</a>   
     </div>
      `;
    });

    notesHtml += `
      </body>
      </html>
    `;

    res.send(notesHtml);
  });
});

app.get('/delete-note/:id', (req, res) => {
  const noteId = req.params.id;

  const sql = "DELETE FROM notes WHERE id = ?";

  db.query(sql, [noteId], (err, result) => {
    if (err) {
      return res.send("Could not delete note");
    }

    return res.redirect('http://172.16.50.129:3000/notes');
  });
});

app.get('/edit-note/:id', (req, res) => {
  const noteId = req.params.id;

  const sql = "SELECT * FROM notes WHERE id = ?";

  db.query(sql, [noteId], (err, result) => {
    if (err || result.length === 0) {
      return res.send("Note not found");
    }

    const note = result[0];

    res.send(`
      <html>
      <head>
        <title>Edit Note</title>
        <style>
          body {
            font-family: Arial;
            background-color: #f7f7f7;
            color: #6b7d95;
            padding: 40px;
          }

          .edit-box {
            width: 500px;
            margin: auto;
            background-color: #fcfbfa;
            border: 1px solid #ece7e3;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
          }

          input, textarea {
            width: 100%;
            padding: 14px;
            margin-bottom: 15px;
            border: 1px solid #d8e0e8;
            border-radius: 10px;
            box-sizing: border-box;
            background-color: #f8f5ef;
            font-family: Arial;
          }

          textarea {
            height: 140px;
          }

          button, a {
            background-color: #9fd2f5;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 12px 20px;
            text-decoration: none;
            cursor: pointer;
            font-size: 15px;
          }
        </style>
      </head>
      <body>
        <div class="edit-box">
          <h1>Edit Note</h1>

          <form action="/update-note/${note.id}" method="POST">
            <input type="text" name="title" value="${note.title}">
            <textarea name="content">${note.content}</textarea>
            <button type="submit">Update Note</button>
          </form>

          <br>
          <a href="/notes">Back to Notes</a>
        </div>
      </body>
      </html>
    `);
  });
});

app.post('/update-note/:id', (req, res) => {
  const noteId = req.params.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.send("Title and content are required");
  }

  const sql = "UPDATE notes SET title = ?, content = ? WHERE id = ?";

  db.query(sql, [title, content, noteId], (err, result) => {
    if (err) {
      return res.send("Could not update note");
    }

    return res.redirect('/notes');
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

