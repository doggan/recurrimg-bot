var _ = require('lodash'),
    recurrimg = require('recurrimg'),
    path = require('path'),
    rimraf = require('rimraf'),
    Twitter = require('twitter');
    
var OUTPUT_DIR = './output/';
var GIF_PATH = path.join(OUTPUT_DIR, 'result.gif');

function checkConfig() {
    if (!process.env.TWITTER_RECURRIMG_CONSUMER_KEY ||
        !process.env.TWITTER_RECURRIMG_CONSUMER_SECRET ||
        !process.env.TWITTER_RECURRIMG_ACCESS_TOKEN_KEY ||
        !process.env.TWITTER_RECURRIMG_ACCESS_TOKEN_SECRET) {
        throw new Error('Environment variables for Twitter API not set.');
    }
    if (!process.env.MRISA_IMAGE_SERVER) {
        throw new Error('Environment variable for image server not set.');
    }
}

checkConfig();

var client = new Twitter({
    consumer_key: process.env.TWITTER_RECURRIMG_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_RECURRIMG_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_RECURRIMG_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_RECURRIMG_ACCESS_TOKEN_SECRET,
});

function buildGif(startImage, onFinished) {
    // Clean up output dir for consecutive executions.
    rimraf.sync(OUTPUT_DIR);

    var params = {
        startImage: startImage,
        iterationCount: 100,
        imageServer: process.env.MRISA_IMAGE_SERVER,
        outputDir: OUTPUT_DIR,
        gifOptions: {
            path: GIF_PATH,
            dimensions: [128, 128],
            delay: 100,
            quality: 10,
            repeat: 0
        }
    };

    recurrimg.go(params, function(err, resultObject) {
        if (err) {
            console.error('Failure: ' + err.message);
            return;
        }

        onFinished(resultObject);
    });
}

function postToTwitter(gifPath, onFinished) {
    var data = {
        media: require('fs').readFileSync(gifPath)
    };

    console.log('Uploading image...');
    client.post('media/upload', data, function(error, media, response) {
        if (error) {
            return onFinished(error);
        }

        var status = {
            status: '#gif #recurrimg #recursive',
            media_ids: media.media_id_string
        };

        console.log('Posting tweet...');
        client.post('statuses/update', status, function(error, tweet, response) {
            if (error) {
                return onFinished(error);
            }

            onFinished();
        });
    });
}

module.exports = {
    /**
     * Perform a recursive image search using the startImage, and post
     * the resulting gif to twitter.
     */
    createGifAndTweet: function(startImage) {
        console.log('Start image: ' + startImage);
        
        buildGif(startImage, function(resultObject) {
            postToTwitter(GIF_PATH, function(error) {
                if (error) {
                    console.error('Failure: ' + error.message);
                } else {
                    console.log('Success!');
                }
            });
        });
    },
    
    /**
     * Find a random image on twitter using the search term provided.
     */
    getRandomImageUrl: function(searchTerm, onFinished) {
        var resultUrls = [];
        client.get('search/tweets', {q: searchTerm}, function(error, tweets, response) {
            _.forEach(tweets.statuses, function(status) {
                _.forEach(status.entities, function(entityObjects) {
                    _.forEach(entityObjects, function(entity) {
                        if (entity.media_url) {
                            resultUrls.push(entity.media_url);
                        }
                    });
                });
            });
            
            onFinished(resultUrls);
        });
    }
};
