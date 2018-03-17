'use strict';

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE;
const GOOGLE_API_URL = process.env.GOOGLE_API_URL;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CLIENT_URL = process.env.CLIENT_URL;

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const sa = require('superagent');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const client = require('./db-client');

function ensureAdmin(request, response, next) {
    const token = request.get('token') || request.query.token;
    console.log(token);
    if(!token) next({ status: 401, message: 'No token found'});

    else if(token !== ADMIN_PASSPHRASE) next({ status: 403, message: 'Unauthorized' });

    else next();
}

app.get('/api/v1/admin', (request, response) => {
    console.log('hello');
    ensureAdmin(request, response, err => {
        response.send({ admin: !err });
    });
});

app.get('/api/v1/books/find', (request, response, next) => {
    const search = request.query.q;
    if(!search) return next({ status:400, message: 'search query must be provided'});

    sa.get(GOOGLE_API_URL)
        .query({
            q: search.trim(),
            apikey: GOOGLE_API_KEY
        })
        .then(res => {
            const body = res.body;
            const formatted = {
                books: body.items.map(book =>{
                    return {
                        title: book.volumeInfo.title,
                        author: book.volumeInfo.authors ? book.volumeInfo.authors[0] : null,
                        isbn: book.volumeInfo.industryIdentifiers[0].identifier,
                        image_url: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : null,
                        description: book.volumeInfo.description || null
                    };
                })
            };
            response.send(formatted);
        })
        .catch(next);
});

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


app.put('/api/v1/books/:id', ensureAdmin, (request, response, next) => {
    const body = request.body;

    client.query(`
        UPDATE books
        SET title=$1,
            author=$2,
            image_url=$3,
            description=$4,
            isbn=$5
        WHERE id=$6
        RETURNING id, title, author, image_url, description, isbn;
    `,
    [
        body.title,
        body.author,
        body.image_url,
        body.description,
        body.isbn,
        body.id
    ]
    )
        .then(result => response.send(result.rows[0]))
        .catch(next);
});

app.delete('/api/v1/books/:id', ensureAdmin, (request, response, next) => {
    const id = request.params.id;

    client.query(`
        DELETE FROM books
        WHERE id=$1;
    `,
    [id]
    )
        .then(result => response.send({ removed: result.rowCount !== 0 }))
        .catch(next);
});

app.get('*', (request, response) => {
    response.redirect(CLIENT_URL);
});


// eslint-disable-next-line
app.use((err, request, response, next) => { 
    console.log(err);
    if(err.status) {
        response.status(err.status).send({ error: err.message });
    }
    else {
        response.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
