import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";

import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = 3000;


app.set("view engine", "ejs");
app.set("views", "./views");


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


const db = new pg.Client({
   user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});
db.connect();

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books ORDER BY id ASC");
    res.render("index.ejs", { books: result.rows });
  } catch (err) {
    console.error(err);
    res.send("Error fetching books.");
  }
});

// Add book form
app.get("/add", (req, res) => {
  res.render("add.ejs");
});


app.get("/edit/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    if (result.rows.length === 0) {
      return res.send("Book not found.");
    }
    res.render("edit.ejs", { book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.send("Error fetching book for edit.");
  }
});

// Search route for PostgreSQL
app.get('/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const result = await db.query(
      "SELECT * FROM books WHERE title ILIKE $1 OR author ILIKE $1 OR genre ILIKE $1",
      [`%${q}%`]
    );
    res.render("search.ejs", { results: result.rows, query: q });
  } catch (err) {
    console.error(err);
    res.send("Error searching books.");
  }
});


// Add book action
app.post("/add", async (req, res) => {
  const { title, author, isbn, genre, available } = req.body;
  try {
    await db.query(
      "INSERT INTO books (title, author, isbn, genre, available) VALUES ($1, $2, $3, $4, $5)",
      [title, author, isbn, genre, available === "on"]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error adding book.");
  }
});

// Delete book
app.post("/delete/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    await db.query("DELETE FROM books WHERE id = $1", [bookId]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error deleting book.");
  }
});

// Update book
app.post("/edit/:id", async (req, res) => {
  const bookId = req.params.id;
  const { title, author, isbn, genre, available } = req.body;
  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, isbn = $3, genre = $4, available = $5 WHERE id = $6",
      [title, author, isbn, genre, available === "on", bookId]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error updating book.");
  }
});
console.log("ENV PGUSER:", process.env.PGUSER);
console.log("ENV PGPASSWORD:", process.env.PGPASSWORD);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
