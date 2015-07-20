var scheduler = require('node-schedule'),
    bot = require('./index');

console.log('Starting recurrimg daemon...');

// START HEROKU SETUP
var express = require("express");
var app = express();
app.get('/', function(req, res){ res.send('No problems here!'); });
app.listen(process.env.PORT || 5000);
// END HEROKU SETUP

/**
 * A search term for finding the start image.
 * Ideally, this word could be randomized... but since world news
 * is constantly changing, this gives us a decent alternative.
 */
var SEARCH_TERM = 'news';

console.log('Scheduling job...');
scheduler.scheduleJob('0 * * * *', function() {
    console.log('Start search...');
    bot.getRandomImageUrl(SEARCH_TERM, function(imageUrls) {
        if (imageUrls.length === 0) {
            console.log('No starting images found. Will try again later.');
            return;
        }
        
        var imageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        bot.createGifAndTweet(imageUrl);
    });
});
