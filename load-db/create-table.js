'use strict';

const client = require('../db-client');

client.query(`
    CREATE TABLE IF EXISTS books (
        id SERIAL PRIMARY KEY,
        author VARCHAR(256),
        title VARCHAR(256),
        isbn INTEGER,
        image_url VARCHAR,
        description VARCHAR
    );
`)
    .then(
        () => console.log('Table creation successful'),
        err => console.error(err)
    )
    .then(() => client.end());