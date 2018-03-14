'use strict';

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const client = require('./db-client');


app.get('/api/v1/books', (request, response) => {
    client.query(`
    SELECT id, title, author, image_url FROM books;
    `)
        .then(results => response.send(results.rows))
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
    
});

app.get('/api/v1/books/:id', (request, response) => {
    const id = request.params.id;
    client.query(`
    SELECT id, title, author, image_url, description, isbn 
    FROM books
    WHERE id=$1;
    `,
    [id])
        .then(results => {
            if (results.rows.length === 0) response.sendStatus(404);
            else response.send(results.rows[0]);
        })
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
    
});

app.post('/api/v1/books', (request, response) => {
    const body = request.body;
    client.query(`
    INSERT INTO books (title, author, image_url, description, isbn)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, author, image_url, description, isbn`,
    [body.title, body.author, body.image_url, body.description, body.isbn]
    )
        .then(results => response.send(results.rows[0]))
        .catch(err => {
            console.error(err);
            response.sendStatus(500);
        });
});


app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
