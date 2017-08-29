const express = require('express');
const bodyParser = require('body-parser');

// **TODO: Configure babel with a build tool...
// import Express from 'express';
// import BodyParser from 'body-parser';

const app = express();

// Port the API Server will be
// listening on for requests.
const port = 8000;

//see?
require('./app/routes')(app, {});
app.listen(port, () => {
    console.log(`Lunchinator API Server listening on port ${port}...`);
})

