'use strict';

const client = require('../db-client');
const books = require('./books.json');

Promise.all(books.map(book => {
    return client.query(`
        INSERT INTO books (author, title, isbn, image_url, description)
        VALUES ($1, $2, $3, $4, $5);
    `,
    [
        book.author, book.title, book.isbn, book.image_url, book.description
    ]);
}))
    .then(
        () => console.log('Seeding data successful'),
        err => console.error(err)
    )
    .then(() => client.end());