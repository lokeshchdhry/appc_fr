#!/usr/bin/env node
var cloneRepo_NPM = require('./clinpm/clone_clinpm'),
    cloneRepo_CLICore = require('./clicore/clone_clicore'),
    buildsdk = require('./sdk/buildsdk'),
    build_clinpm = require('./clinpm/build_clinpm'),
    build_clicore = require('./clicore/build_clicore'),
    cleanup_clinpm = require('./clinpm/cleanup_clinpm'),
    cleanup_clicore = require('./clicore/cleanup_clicore'),
    setup = require('./setup/setup'),
    sdkutil = require('./sdk/sdkutil'),
    util = require('./misc/util'),
    components = require('./qe_utility/components'),
    inquirer = require('inquirer'),
    qeutility_util = require('./qe_utility/qeutility_util'),
    setup_runcount = require('./misc/util').runcount;


const main_run = () => {
  //Getting the value of runCount from storages
  //Checking if SETUP has beed run before, if not run setup or else show the menu
  if( setup_runcount === undefined){
    console.log('');
    var questions = [{
        name: 'run_check',
        type: 'confirm',
        message: '\"SETUP\" has to been run atleast once before using this tool. Would you like to continue?'
    }];
    inquirer.prompt(questions).then(function(answers) {
      if(answers.run_check){
        //Run setup
        setup.run();
      }
      else{
        //Exiting the process
        process.exit();
      }
    });
  }
  else{
    inquirer.prompt({
      type: 'list',
      name: 'main_options',
      message: 'What would you like to do ?',
      choices: [{
        name: 'RUN QE UTILITY',
        value: 'qe_utility'
      },
      {
        name: 'FR TOOLS FOR SDK',
        value: 'sdk_fr'
      },{
        name: 'FR TOOLS FOR CLI NPM',
        value: 'clinpm_fr'
      },{
        name: 'FR TOOLS FOR CLI CORE',
        value: 'clicore_fr'
      },{
        name: 'SETUP',
        value: 'setup'
      },{
        name: 'EXIT',
        value: 'exit'
      }]
    }).then(function (answers) {
      switch(answers.main_options){
        case 'qe_utility':
        inquirer.prompt({
          type: 'list',
          name: 'qe_util_opt',
          pageSize: 10,
          message: 'What would you like to do in QE Utility ?',
          choices: [{
            name: 'CHECK INSTALLED COMPONENTS',
            value:'compo'
          },
          {
            name: 'INSTALL APPC CORE',
            value:'install_core'
          },
          {
            name: 'INSTALL APPC NPM',
            value:'install_appc_npm'
          },
          {
            name: 'INSTALL TITANIUM SDK',
            value:'install_sdk'
          },
          {
            name: 'SELECT SPECIFIC TITANIUM SDK',
            value:'select_sdk'
          },
          {
            name: 'CHANGE ENVIRONMENT',
            value:'change_env'
          },
          {
            name: 'UNINSTALL APPS',
            value:'remove_apps'
          },
          {
            name: 'IMPORT APPS',
            value:'import_apps'
          },
          {
            name: 'LAUNCH AVD',
            value:'launch_avd'
          },
          {
            name: 'EXIT',
            value: 'exit'
          }]
        }).then(function(answers){
          exec_qe_utility(answers.qe_util_opt);
        });
        break;

        case 'sdk_fr':
        inquirer.prompt({
          type: 'list',
          name: 'sdk_fr_opt',
          message: 'What would you like to do ?',
          choices: [{
            name: 'CLONE TIMOB SDK REPO',
            value:'clone_sdk'
          },
          {
            name: 'BUILD SDK FOR PR',
            value:'build_sdk'
          },
          {
            name: 'EXIT',
            value: 'exit'
          }]
        }).then(function(answers){
          exec_sdk_fr(answers.sdk_fr_opt);
        });
        break;

        case 'clinpm_fr':
        inquirer.prompt({
          type: 'list',
          name: 'clinpm_fr_opt',
          message: 'What would you like to do ?',
          choices: [{
            name: 'CLONE APPC CLI NPM REPO',
            value:'clone_clinpm'
          },
          {
            name: 'BUILD APPC CLI NPM',
            value:'build_clinpm'
          },
          {
            name: 'CLEANUP APPC CLI NPM',
            value:'clean_clinpm'
          },{
            name: 'EXIT',
            value: 'exit'
          }]
        }).then(function(answers){
          exec_clinpm_fr(answers.clinpm_fr_opt);
        });
        break;

        case 'clicore_fr':
        inquirer.prompt({
          type: 'list',
          name: 'clicore_fr_opt',
          message: 'What would you like to do ?',
          choices: [{
            name: 'CLONE APPC CLI CORE REPO',
            value:'clone_clicore'
          },
          {
            name: 'BUILD APPC CLI CORE',
            value:'build_clicore'
          },
          {
            name: 'CLEANUP APPC CLI CORE',
            value:'clean_clicore'
          },{
            name: 'EXIT',
            value: 'exit'
          }]
        }).then(function(answers){
          exec_clicore_fr(answers.clicore_fr_opt);
        });
        break;

        case 'setup':
        inquirer.prompt({
          type: 'list',
          name: 'setup_opt',
          message: 'What would you like to do ?',
          choices: [{
            name: 'RUN SETUP',
            value:'run_setup'
          },
          {
            name: 'CHECK STORED PATHS',
            value:'stored_paths'
          },{
            name: 'EXIT',
            value: 'exit'
          }]
        }).then(function(answers){
          setup_opt(answers.setup_opt);
        });
        break;

        case 'exit':
        exit_func();
        break;
      }
    });

    var exec_qe_utility = function(task){
      switch(task){
        case 'compo':
        components.getcomponents();
        break;

        case 'install_core':
        qeutility_util.installCore();
        break;

        case 'install_appc_npm':
        qeutility_util.appcnpm();
        break;

        case 'install_sdk':
        qeutility_util.installsdk();
        break;

        case 'select_sdk':
        qeutility_util.selectsdk();
        break;

        case 'change_env':
        qeutility_util.change_env();
        break;

        case 'remove_apps':
        qeutility_util.uninstallapps();
        break;

        case 'import_apps':
        qeutility_util.importapps();
        break;

        case 'launch_avd':
        qeutility_util.launchavd();
        break;

        case 'exit':
        exit_func();
        break;

        default:
        console.log('Invalid utility option');
      }
    };

    var exec_sdk_fr = function(task){
      switch(task){
        case 'clone_sdk':
        sdkutil.cloneSDKrepo();
        break;

        case 'build_sdk':
        buildsdk.run();
        break;

        case 'exit':
        exit_func();
        break;

        default:
        console.log('Invalid sdk option');
      }
    };

    var exec_clinpm_fr = function(task){
      switch(task){
        case 'clone_clinpm':
        cloneRepo_NPM();
        break;

        case 'build_clinpm':
        build_clinpm();
        break;

        case 'clean_clinpm':
        cleanup_clinpm();
        break;

        case 'exit':
        exit_func();
        break;

        default:
        console.log('Invalid CLI NPM option');
      }
    };

    var exec_clicore_fr = function(task){
      switch(task){
        case 'clone_clicore':
        cloneRepo_CLICore();
        break;

        case 'build_clicore':
        build_clicore();
        break;

        case 'clean_clicore':
        cleanup_clicore();
        break;

        case 'exit':
        exit_func();
        break;

        default:
        console.log('Invalid CLI CORE option');
      }
    };

    var setup_opt = function(task){
      switch(task){
        case 'run_setup':
        setup.run();
        break;

        case 'stored_paths':
        setup.displayData(true);
        break;

        case 'exit':
        exit_func();
        break;

        default:
        console.log('Invalid Setup option');
      }
    };

    var exit_func = function(){
      //exit process
      process.exit();
    };
  }
}

//Running the main menu options
main_run();
