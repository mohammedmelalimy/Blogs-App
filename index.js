const express = require('express')
const app = express()
const mysql = require('mysql2')
const port = 3000

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blogs'
})

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message)
    return 
  }
  console.log('Connected successfully to database')
})

app.post('/register', (req, res) => {
  const {email, password, full_name, dob} = req.body;
  const query = 'INSERT INTO users (email, password, full_name, dob) VALUES (?, ?, ?, ?)';
  db.execute(query, [email, password, full_name, dob], (err, results) => {
    if (err) {
      console.error('Error inserting user:', err.message);
      res.status(500).send('Error registering user');
      return;
    }
    console.log('User registered successfully');
    res.status(200).send('User registered successfully');
  });
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))