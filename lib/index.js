#! /usr/bin/env node

var recurrimg = require('recurrimg'),
    path = require('path'),
    rimraf = require('rimraf'),
    Twitter = require('twitter'),
    program = require('commander'),
    packageJSON = require('../package.json');

program
    .version(packageJSON.version)
    .option('-i, --start_image <url>', 'start image url')
    .parse(process.argv);

if (!process.env.TWITTER_CONSUMER_KEY ||
    !process.env.TWITTER_CONSUMER_SECRET ||
    !process.env.TWITTER_ACCESS_TOKEN_KEY ||
    !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error('Environment variables for Twitter API not set.');
}

var START_IMAGE = program.start_image;
if (!START_IMAGE) {
    console.error('Start image not defined.');
    program.help();
}

console.log('Start image: ' + START_IMAGE);

var OUTPUT_DIR = './output/';
var GIF_PATH = path.join(OUTPUT_DIR, 'result.gif');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

function buildGif(startImage, onFinished) {
    // Clean up output dir for consecutive executions.
    rimraf.sync(OUTPUT_DIR);

    var params = {
        startImage: startImage,
        iterationCount: 100,
        imageServer: 'http://localhost:5000/search',
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

buildGif(START_IMAGE, function(resultObject) {
    postToTwitter(GIF_PATH, function(error) {
        if (error) {
            console.error('Failure: ' + error.message);
        } else {
            console.log('Success!');
        }
    });
});
