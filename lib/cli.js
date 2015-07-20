#! /usr/bin/env node

var program = require('commander'),
    packageJSON = require('../package.json'),
    app = require('./index');

program
    .version(packageJSON.version)
    .option('-i, --start_image <url>', 'start image url')
    .parse(process.argv);

if (!program.start_image) {
    console.error('Start image not defined.');
    program.help();
}

app.createGifAndTweet(program.start_image);
