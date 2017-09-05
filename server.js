const express = require('express');
const bodyParser = require('body-parser');
const validation = require('./app/validation.js');
const suggestions = require('./app/suggestions.js');
const uuidv4 = require('uuid/v4');

// API app to use
const app = express();

// ATTACH MIDDLEWARE
// *****************

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// GLOBALS INCLUDING MOCK DATABASE
// *******************************

// Port the API Server will be
// listening on for requests.
const port = 8000;

// The mutable object where we will store
// data about ballots. Our mock DB for this micro-project.
let ballots = {};

// MAIN API ENDPOINTS
// ******************

////////////////////////////////////////////////////////////////////////////////////

app.post('/api/create-ballot',(request, response) => {
    
    validation.validateCreateBallotBody(request, response)
    
    if(!response.headersSent){
        // We passed the validation. Create the new ballot.
        newBallotId = uuidv4();
        ballots[newBallotId] = request.body;
        // Now add 5 randomly selected and formatted
        // restaurants for this ballot, saving in server memory.
        suggestions.getNewSuggestions()
            .then(options => ballots[newBallotId].options = options)
            // Return ballot ID of new ballot to user.
            .then(_ => response.setHeader('Content-Type', 'application/json'))
            .then(_ => response.end(JSON.stringify({ballotId: newBallotId})))
    }
});

////////////////////////////////////////////////////////////////////////////////////

// TODO: Move this validation to ./validation.js
app.get('/api/ballot/:ballotId',(request, response) => {
    validation.validateGetBallot(request, response, ballots)
    if(!response.headersSent){
        // We passed the validation. Return the ballot
        const ballotId = request.params.ballotId
        response.setHeader('Content-Type', 'application/json')
        const result = suggestions.formatSuggestions(ballots[ballotId])
        response.end(JSON.stringify(result))
    }
});

////////////////////////////////////////////////////////////////////////////////////

app.post('/api/vote',(request, response) => {
    validation.validateVote(request, response, ballots)
    if(!response.headersSent){
        // We passed the validation. Record the vote.
        // TODO: record the vote
        response.setHeader('Content-Type', 'application/json')
        response.end()
    }
});

////////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {
    console.log(`Lunchinator API Server listening on port ${port}...`)
})

