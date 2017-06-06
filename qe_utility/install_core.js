var inquirer = require('inquirer');
var Async = require('async');
var cyan = require('../misc/util').cyan;
var errorNExit = require('../misc/util').errorNExit;
var execute = require('../misc/util').execute;
var spinner_start = require('../misc/util').spinner_start;
var spinner_stop = require('../misc/util').spinner_stop;

module.exports = function(){

  Async.waterfall([
    function getCLIVer(callback) {
      var questions = [{
        name: 'cli_ver',
        type: 'input',
        message: 'Enter the CLI core version which you would like to download(e.g: 6.2.0) :',
        validate: function(value) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter the CLI core version which you would like to download.';
          }
        }
      }];
      inquirer.prompt(questions).then(function(answers) {
        callback(null, answers.cli_ver);
      });
    },

    function downloadCore(version, callback){
      console.log('\n\u25B6 Downloading & installing CLI Core version : '+cyan(version));
      spinner_start();
      execute('appc use '+version, function(err, data){
        if(err){
          errorNExit(err);
        }
        spinner_stop(true);
        console.log(cyan(data));
        callback(null);
      });
    }
  ],function(err, results){
    if(err){
      errorNExit(err);
    }
  });
};
