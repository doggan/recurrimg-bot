var scheduler = require('node-schedule'),
    app = require('./index');

console.log('Starting recurrimg daemon...');

/**
 * A search term for finding the start image.
 * Ideally, this word could be randomized... but since world news
 * is constantly changing, this gives us a decent alternative.
 */
var SEARCH_TERM = 'news';

scheduler.scheduleJob('0,30 * * * *', function() {
    console.log('Start search...');
    app.getRandomImageUrl(SEARCH_TERM, function(imageUrls) {
        if (imageUrls.length == 0) {
            console.log('No starting images found. Will try again later.');
            return;
        }
        
        var imageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        app.createGifAndTweet(imageUrl);
    });
});
