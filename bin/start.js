#!/usr/bin/env node

var Application = require('..').Application;
var app = new Application({appDir: process.cwd()});
app.start();
