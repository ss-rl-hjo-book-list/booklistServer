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

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
