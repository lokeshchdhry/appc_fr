var fs = require('fs');
var chalk = require('chalk');
var inquirer = require('inquirer');
var util = require('../misc/util');
var path = require('path');
var Async = require('async');
var storage = require('node-persist');

module.exports = function() {
  var android_sdk, android_ndk;
    //Get the username
    var user = util.user;
    //Checking if bash profile exists
    fs.exists(path.join('/Users', user, '.bash_profile'), function(exists) {
      if (exists) {
        android_sdk = process.env.ANDROID_SDK;
        android_ndk = process.env.ANDROID_NDK;

        //Hardcoding the cli core clone path/dir
        var clicore_install_path = path.join('/Users', user, '.appcelerator','install', '1.0.0');
        util.setSyncValue('dir_cli_core', clicore_install_path);

        var task = [];
        // task.push(function(callback) {checkBashProfile(callback, user);});
        task.push(function(callback) {checkAndroidSDKEnvVar(callback, android_sdk);});
        task.push(function(callback) {checkAndroidNDKEnvVar(callback, android_ndk);});
        task.push(function(callback) {setupRepoLinksNPaths(callback);});
        Async.series(task, function(err, results){
          if(err){
            //exit process in case of error
            process.exit();
          }
        });
      }
      else {
        console.log(util.error('\n\u2717.bash_profile does not exist. Please create one.'));
        //exit process in case of error
        process.exit();
      }
    });
  };

  function checkAndroidSDKEnvVar(callback, andSDKEnvVar){
    console.log(util.underline('\nChecking if ANDROID_SDK env variable is set.'));
    if (andSDKEnvVar === undefined) {
      console.log(util.cyan('\n\u2717 ANDROID_SDK env variable is not set. Let\'s set it up.'));

      var questions = [{
        name: 'android_sdkPath',
        type: 'input',
        message: 'Enter the path for android SDK :'
      }];
      inquirer.prompt(questions).then(function(answers) {
        //CD into the user dir
        process.chdir('/Users/' + user);
        //Logic to edit bash profile to add ANDROID_SDK & ANDROID_NDK
        var data1 = fs.readFileSync('.bash_profile').toString().split("\n");
        data1.splice(40, 0, 'export ANDROID_SDK=' + answers.android_sdkPath);
        var text = data1.join("\n");

        fs.writeFile('.bash_profile', text, function(err) {
          if (err){
            console.log(util.error(err));
            //exit process in case of error
            process.exit();
          }
          else {
            console.log(util.cyan('\n\u2714 Done adding ANDROID_SDK to the bash_profile.'));
            callback(null, null);
          }
        });
      });
    } else {
      console.log(util.cyan('\u2714 ANDROID_SDK is set in bash_profile\n'));
      callback(null, null);
    }
  }

  function checkAndroidNDKEnvVar(callback, andNDKEnvVar){
    console.log(util.underline('\nChecking if ANDROID_NDK env variable is set.'));
    if (andNDKEnvVar === undefined) {
      console.log(util.cyan('\n\u2717 ANDROID_SNK env variable is not set. Let\'s set it up.'));

      var questions = [{
        name: 'android_ndkPath',
        type: 'input',
        message: 'Enter the path for android NDK :'
      }];
      inquirer.prompt(questions).then(function(answers) {
        //CD into the user dir
        process.chdir('/Users/' + user);
        //Logic to edit bash profile to add ANDROID_SDK & ANDROID_NDK
        var data1 = fs.readFileSync('.bash_profile').toString().split("\n");
        data1.splice(41, 0, 'export ANDROID_NDK=' + answers.android_ndkPath);
        var text = data1.join("\n");

        fs.writeFile('.bash_profile', text, function(err) {
          if (err){
            console.log(util.error(err));
            //exit process in case of error
            process.exit();
          }
          else {
            console.log(util.cyan('\n\u2714 Done adding ANDROID_NDK to the bash_profile.'));
            callback(null, null);
          }
        });
      });
    } else {
      console.log(util.cyan('\u2714 ANDROID_NDK is set in bash_profile'));
      callback(null, null);
    }
  }

  function setupRepoLinksNPaths(callback){
    console.log(util.underline('\n\u25B6 Setting repo links & repo paths:'));
    //questions object array
    var questions = [{
      name: 'repo_link_sdk',
      type: 'input',
      message: 'Enter the titanium_mobile repo link to clone :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the titanium_mobile repo link to clone :';
        }
      }
    },
    {
      name: 'dir_sdk',
      type: 'input',
      message: 'Enter path to dir where you want to clone the titanium_mobile repo :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter path to dir where you want to clone the titanium_mobile repo';
        }
      }
    },
    {
      name: 'repo_link_npm',
      type: 'input',
      message: 'Enter the Appc NPM repo link :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return ('Please enter the Appc NPM repo link to clone :');
        }
      }
    },
    {
      name: 'dir_npm',
      type: 'input',
      message: 'Enter path to dir where you want to clone the Appc NPM repo :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter path to dir where you want to clone the Appc NPM repo :';
        }
      }
    },
    {
      name: 'repo_link_cli_core',
      type: 'input',
      message: 'Enter the CLI core repo link :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the CLI core repo link :';
        }
      }
    },
    {
      name: 'username',
      type: 'input',
      message: 'Enter the CLI login username :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the CLI login username :';
        }
      }
    },
    {
      name: 'password',
      type: 'password',
      message: 'Enter the CLI login password :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the CLI login password :';
        }
      }
    },
    {
      name: 'prod_org_id',
      type: 'input',
      message: 'Enter the production org id (which you normally use) :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the production org id :';
        }
      }
    },
    {
      name: 'preprod_org_id',
      type: 'input',
      message: 'Enter the pre-production org id (which you normally use) :',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the pre-production org id :';
        }
      }
    }
  ];
  inquirer.prompt(questions).then(function(answers) {
    //Storing the repo link & repo dir using node persist.
    util.setSyncValue('repo_link_sdk', answers.repo_link_sdk);
    util.setSyncValue('dir_sdk', answers.dir_sdk);
    util.setSyncValue('repo_link_npm', answers.repo_link_npm);
    util.setSyncValue('dir_npm', answers.dir_npm);
    util.setSyncValue('repo_link_cli_core', answers.repo_link_cli_core);
    util.setSyncValue('username', answers.username);
    util.setSyncValue('password', answers.password);
    util.setSyncValue('prod_org_id', answers.prod_org_id);
    util.setSyncValue('preprod_org_id', answers.preprod_org_id);

    //Getting the stored info & printing the details to console
    console.log('');
    console.log(util.underline('\u25B6 Stored information: (Please Double Check)'));
    console.log('TIMOB repo link :    ' + util.cyan(util.repolink_sdk));
    console.log('TIMOB SDK clone dir: ' + util.cyan(util.sdk_dir));
    console.log('Appc NPM repo link : ' + util.cyan(util.repolink_clinpm));
    console.log('Appc NPM clone dir : ' + util.cyan(util.npm_dir));
    console.log('CLI core repo link : ' + util.cyan(util.repolink_clicore));
    console.log('CLI core dir :       ' + util.cyan(util.clicore_dir));
    console.log('CLI username :       ' + util.cyan(util.username));
    console.log('CLI password :       ' + util.cyan(storage.getItemSync('password')));
    console.log('Prod Org id :        ' + util.cyan(util.prod_org_id));
    console.log('Preprod Org id :     ' + util.cyan(util.preprod_org_id));
    console.log('');
    console.log('\u2714 Setup Complete.');
    console.log('');
    callback(null, null);
  });
}
