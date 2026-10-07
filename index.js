const express = require('express')
const app = express()
const mysql = require('mysql2')
const port = 3000

app.use(express.json());


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
      res.status(500).send('Error registering user');
      return;
    }
    res.status(200).send('User registered successfully');
  });
})

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';

  db.execute(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({
        status: false,
        message: 'Database error'
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }

    if (results[0].password !== password) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'User logged in successfully',
      data: results[0]
    });
  });
});

app.get('/profile/:user_id', (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT 
      full_name,
      email,
      YEAR(CURDATE()) - YEAR(dob) AS age
    FROM users
    WHERE id = ?
  `;

  db.execute(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        status: false,
        message: 'Database error',
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'User profile retrieved successfully',
      data: results[0]
    });
  });
});

// GET /users/search?full_name=Ahmed
app.get('/users/search', (req, res) => {
  const fullName = req.query.full_name?.trim();

  if (!fullName) {
    return res.status(400).json({
      status: false,
      message: 'full_name is required'
    });
  }

  const query = `
    SELECT id, full_name, email, dob
    FROM users
    WHERE full_name LIKE ?
  `;

  db.execute(query, [`%${fullName}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Database error' });
    }

    return res.json({ status: true, data: results });
  });
});

// PATCH /users/5
app.patch('/users/:user_id', (req, res) => {
  const { user_id } = req.params;
  const allowedFields = ['full_name', 'email', 'dob', 'password'];
  const fields = allowedFields.filter(field =>
    Object.prototype.hasOwnProperty.call(req.body || {}, field)
  );

  if (!/^[1-9]\d*$/.test(user_id)) {
    return res.status(400).json({ status: false, message: 'Invalid user ID' });
  }

  if (fields.length === 0) {
    return res.status(400).json({
      status: false,
      message: 'Send at least one field to update'
    });
  }

  if (fields.some(field =>
    typeof req.body[field] !== 'string' || !req.body[field].trim()
  )) {
    return res.status(400).json({
      status: false,
      message: 'Updated fields must contain non-empty text'
    });
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = [...fields.map(field => req.body[field].trim()), user_id];

  db.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values, (err, result) => {
    if (err) {
      const status = err.code === 'ER_DUP_ENTRY' ? 409 : 500;
      return res.status(status).json({
        status: false,
        message: status === 409 ? 'Email already exists' : 'Database error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    return res.json({ status: true, message: 'User updated successfully' });
  });
});

// DELETE /users/5
app.delete('/users/:user_id', (req, res) => {
  const { user_id } = req.params;

  if (!/^[1-9]\d*$/.test(user_id)) {
    return res.status(400).json({ status: false, message: 'Invalid user ID' });
  }

  db.execute('DELETE FROM users WHERE id = ?', [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    return res.json({ status: true, message: 'User deleted successfully' });
  });
});

app.post('/blog',(req,res)=>{
  const {title, body, user_id} = req.body;
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Database error' });
    }

    if (results.length > 0) {
      const insertQuery = 'INSERT INTO blogs (title, body, user_id) VALUES (?, ?, ?)';
      db.execute(insertQuery, [title, body, user_id], (err, results) => {
        if (err) {
          return res.status(500).json({ status: false, message: 'Database error' });
        }
        return res.status(200).json({ status: true, message: 'Blog created successfully' });
      });
    }else{
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    
})
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))