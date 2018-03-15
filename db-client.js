const dotenv = require('dotenv');
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

const pg = require('pg');
const Client = pg.Client;

const client = new Client(DATABASE_URL);
client.connect()
    .then(() => console.log('connected to db', DATABASE_URL))
    .catch(err => console.log('connection error', err));

client.on('error', err => console.log(err));

module.exports = client;