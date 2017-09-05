// Utility for sending errors.
const sendError = (response, statusCode, errorJson) => {
    response.setHeader('Content-Type', 'application/json')
    response.status(statusCode)
    response.end(JSON.stringify(errorJson));
}

// Will error if  request.body[fieldName] cannot be parsed as a valid date.
const validateDate = (request, response, fieldName) => {
    const date = request.body[fieldName];
    if(isNaN(Date.parse(date))){
        const error = {
            error: `Sorry, a valid date was not supplied for ${fieldName}. '${date}' could not be treated as a valid date.`
        }
        sendError(response, 422, error);
    }
}

// ensures response.body included requiredProperties
const validateFields = (request, response, requiredProperties) => {
    // We only work with arrays in this function
    if (!Array.isArray(requiredProperties)) {
        requiredProperties = [requiredProperties];
    }
    requiredProperties.forEach(key => {
        if (!request.body.hasOwnProperty(key)) {
            const error = {
                error: `Sorry, please include the '${key}' property in your JSON POST body.`
            };
            sendError(response, 422, error);
        }
    })
}

// Ensures each voter has a name and emailAddress
const validateVoters = (request, response) => {
    request.body.voters.forEach(voter => {
        if (!voter.name || !voter.emailAddress) {
            const error = {
                error: `Sorry, this voter did not have both a name and emailAddress:`,
                troubleVoter: voter
            };
            sendError(response, 422, error);
        }
    })
}

// Top-level validation for 'api/create-ballot' route.
const validateCreateBallotBody = (request, response) => {
    validateFields(request, response, ['voters', 'endTime'])
    !response.headersSent && validateVoters(request, response)
    !response.headerSent && validateDate(request, response, 'endTime')
}

// Top-level validation for 'api/ballot/{ballotId}' route.
const validateGetBallot = (request, response, ballots) => {
    const ballotId = request.params.ballotId
    if(!ballots[ballotId]){
        const error = {
        error: `Sorry, you requested data for an invalid ballotId.
        Your selection was ${ballotId}. Possible choices are:
        ${Object.keys(ballots).join(', ')}`
        }
        sendError(response, 422, error)
    }
}

// Top-level validation for 'api/vote' route.
validateVote = (request, response, ballots) => {

    const queryParams = request.query
    const requiredParams = ['id', 'ballotId', 'voterName', 'emailAddress']

    if(Object.keys(queryParams).length === 0){
        const error = {error: `Sorry, to vote, please supply values for these variables via query parameters: ${requiredParams.join(', ')}.`}
        sendError(response, 422, error)
    }

    for (let i = 0; i < requiredParams.length; i++){
        if(!response.headersSent && !queryParams[requiredParams[i]]){
            // The response has not already been send with an error,
            // and the ith required query param is not present, so send an error.
            response.setHeader('Content-Type', 'application/json')
            const error = {error: `Sorry, your vote cannot be processed without a value for the '${requiredParams[i]}' query string parameter.`}
            sendError(response, 422, error)
            break;
        }
    }
}

module.exports = { validateFields, validateDate, validateCreateBallotBody, validateGetBallot, validateVote }