'use strict';

const client = require('../db-client');

client.query(`
    DROP TABLE IF EXISTS books;
`)
    .then(
        () => console.log('Drop successful'),
        err => console.error(err)
    )
    .then(() => client.end());