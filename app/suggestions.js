require('es6-promise').polyfill();
require('isomorphic-fetch');
const utils = require('./utilities');

// Base URL for Restaurant and Reviews
// data fetching end-points.
const restaurantAndReviewsAPI = "https://interview-project-17987.herokuapp.com/api/";

// Retrieves 'numToGet' random restaurants from
// 'restaurantAndReviewsAPI'
const getRandomRestaurants = (numToGet = 5) => {
    let restaurants;
    return fetch("https://interview-project-17987.herokuapp.com/api/restaurants")
        .then(response => response.json())
        .then(restaurants => {

            let randomRestaurantIndexes = []
            let randomRestaurants = []

            // get 'numToGet' random restaurants.
            for (let i = 0; i < numToGet; i++){
                let randomIndex = utils.getRandomInt(0, restaurants.length)
                // Make sure each random index is unique.
                while(randomRestaurantIndexes.includes(randomIndex)){
                    randomIndex = utils.getRandomInt(0, restaurants.length)
                }
                randomRestaurantIndexes.push(randomIndex)
                randomRestaurants.push(restaurants[randomIndex])
            }

            return randomRestaurants

        })
        .catch(error => console.error(error))
}


const findTopSuggestion = (options) => {
    // Find the restaurant option with the highest average review.
    let topSuggestion = options[0]
    options.forEach(option => {
        if(option.averageReview > topSuggestion.averageReview){
            topSuggestion = option
        }
    })
    // Return a trimmed-down set of fields to match
    // user requirements.
    return {
        id: topSuggestion.id,
        name: topSuggestion.name,
        averageReview: topSuggestion.averageReview,
        topReviewer: topSuggestion.topReviewer,
        review: topSuggestion.review
    }
}

// Takes a list of restaurants, and analyzes all reviews
// for those restaurants, finding the average rating for each,
// the top review for each, and a recommended restaurant (the
// restaurant with the highest average rating).
const analyzeRestaurants = (restaurants) => {
    return fetch("https://interview-project-17987.herokuapp.com/api/reviews")
        .then(response => response.json())
        .then(reviews => {
            let analysisResults = []
            restaurants.forEach(restaurant => {

                // find the average rating for this restaurant.
                let reviewerCount = {}
                let indexOfTopReview = 0
                const relevantReviews = reviews.filter(review => review.restaurant === restaurant.name)

                // Loop through each of this restaurant's reviews to find
                // the average rating and the top review.
                let reviewSum = relevantReviews.reduce((sum, review, i, relevantReviews) => {
                    if(parseInt(relevantReviews[i].rating) > parseInt(relevantReviews[indexOfTopReview].rating)){
                        // This rating is higher than the previously found highest rating.
                        // make it the new highest rating.
                        indexOfTopReview = i
                    }
                    return sum + parseInt(review.rating, 10)
                }, 0)

                const averageReview = reviewSum / relevantReviews.length

                const reviewAnalysis = {
                    // round to 1 decimal point. SOURCE: https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
                    averageReview: Math.round(averageReview * 10) / 10,
                    topReviewer: relevantReviews[indexOfTopReview].reviewer,
                    review: relevantReviews[indexOfTopReview].review
                }
                Object.assign(reviewAnalysis, restaurant)

                analysisResults.push(reviewAnalysis)
            })
            const results = {
                suggestion: findTopSuggestion(analysisResults),
                choices: analysisResults.map(analysis => ({
                    // return trimmed-down set of fields to match user requirements.
                    id: analysis.id,
                    name: analysis.name,
                    averageReview: analysis.averageReview,
                    description: analysis.description,
                    votes: 0
                }))
            }
            return results
        })
        .catch(error => console.error(error))
}

// Gets 'numToGet' random restaurants, along with
// analysis data about the restaurants, a top
// suggested restaurant, and initialized vote props
// so these can be used by the lunchinator in a ballot.
const getNewSuggestions = (numToGet = 5) => {
    return getRandomRestaurants(numToGet)
        .then(restaurants => analyzeRestaurants(restaurants))
}

const formatSuggestionsForDeadBallot = (ballot) => {
    // find the winner, then return the winner
    // and the choices, with fields to match the API docs.
    let winner = ballot.options.choices[0]
    ballot.options.choices.forEach(choice => {
        if(choice.votes > winner.votes){
            winner = choice;
        }
    })
    return {
        winner: {
            id: winner.id,
            datetime: (new Date()).toDateString(),
            name: winner.name,
            votes: winner.votes
        },
        choices: utils.shuffle(ballot.options.choices).map(choice => ({
            id: choice.id,
            name: choice.name,
            votes: choice.votes
        }))
    }
}

// Formats suggestions for return from 
// the 'api/ballot/{ballotId}' route.
const formatSuggestions = (ballot) => {
    // If voting deadline has not passed,
    // give the 5 choices and a top suggestion
    if(Date.parse(ballot.endTime) < Date.now()){
        // The voting deadline has passed
        return formatSuggestionsForDeadBallot(ballot)
    } else {
        // The deadline hasn't passed yet.
        return {
            suggestion: ballot.options.suggestion,
            // Randomly shuffle the choices and don't return the votes property.
            choices: utils.shuffle(ballot.options.choices).map(choice => ({
                id: choice.id,
                name: choice.name,
                averageReview: choice.averageReview,
                description: choice.description
            }))
        }
    }
}

module.exports = { getNewSuggestions, formatSuggestions }