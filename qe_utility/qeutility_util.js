'use strict'

const inquirer = require('inquirer'),
      _ = require('underscore'),
      fs = require('fs'),
      path = require('path'),
      spinner_stop = require('../misc/util').spinner_stop,
      spinner_start = require('../misc/util').spinner_start,
      output = require('../misc/output'),
      exec = require('child_process').exec,
      execSync = require('child_process').execSync,
      spawn = require('child_process').spawn,
      os = require('os'),
      prodOrgId = require('../misc/util').prod_org_id,
      preProdOrgId = require('../misc/util').preprod_org_id,
      username = require('../misc/util').username,
      password = require('../misc/util').password,
      adb = require('adbkit').createClient();

class qeutility_util{

  /*****************************************************************************
  * Downloads & installs specified Appc CLI core from prod or preprod
  ****************************************************************************/
  static installCore(){
    return new Promise((resolve, reject) => {
      inquirer.prompt({
        name: 'cli_ver_type',
        type: 'list',
        message: 'Please select which CLI Core to download:',
        choices: [{
          name: 'RELEASED',
          value: 'released'
        },
        {
          name: 'PRE-RELEASE(Preprod)',
          value: 'prerelease'
        },
        {
          name: 'EXIT',
          value: 'exit'
        }]
      })
      .then(answers => {
        //Exit if EXIT
        if(answers.cli_ver_type === 'exit'){
          //Quit the process
          process.exit();
        }
        else{return answers.cli_ver_type;}
      })
      .then(clivertype => {
        if(clivertype === 'released'){
          inquirer.prompt({
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
          })
          .then(answers => {
            output.info('solidarrow', `Downloading & installing release CLI Core version : ${answers.cli_ver}`);
            spinner_start();
            exec(`appc use ${answers.cli_ver}`, (err, data) => {
              if(!err){
                spinner_stop(true);
                output.cyan('tick', data);
                resolve();
              }
              else(reject(err));
            });
          })
        }
        else{
          output.underline('solidarrow', 'GOING TO PREPROD TO GET LATEST PRE-RELEASE CLI CORE:');
          spinner_start();
          let p = Promise.resolve()
          .then(() => {
            return new Promise((resolve, reject) => {
              // output.info('solidarrow','logging you out:');
              exec(`appc logout`, (err, result) => {
                if(!err){
                  resolve();
                }
                else{
                  reject(err);
                  spinner_stop(true);
                }
              });
            });
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              // output.info('solidarrow',`Setting default env to preprod:`);
              exec('appc config set defaultEnvironment preproduction', (err, result) =>{
                if(!err){
                  resolve();
                }
                else{
                  reject(err);
                  spinner_stop(true);
                }
              });
            });
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              const orgIDPreProd = preProdOrgId;
              // output.info('solidarrow', 'Logging you in:');
              exec(`appc login --username ${username} --password ${password} --org-id ${orgIDPreProd}`, (err, result)=> {
                if(!err){
                  spinner_stop(true);
                  output.cyan(null, result);
                  resolve();
                }
                else{
                  reject(err);
                  spinner_stop(true);
                }
              });
            }); 
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              output.underline('solidarrow', 'GETTING LATEST PRE-RELEASE VERSIONS:');
              spinner_start();
              exec('appc use -o json --prerelease', (err, result) => {
                if(!err){
                  const ver_arr = JSON.parse(result)['versions'].slice(0,30);
                  spinner_stop(true);
                  resolve(ver_arr);
                }
                else{
                  reject(err);
                  spinner_stop(true);
                }
              })
            })
          })
          .then(ver_arr => {
            ver_arr = ver_arr.sort().reverse();
            ver_arr.push('EXIT');
            return new Promise((resolve, reject) => {
              inquirer.prompt({
                name: 'pre_core_ver',
                type: 'rawlist',
                pageSize: ver_arr.length,
                message: 'Please select which pre-release CLI Core to download(Showing top 20 choices):',
                choices: ver_arr              
              })
              .then(answers => {        
                if(answers.pre_core_ver === 'EXIT'){
                  resolve();
                }
                else{
                  spinner_start();
                  output.info('solidarrow', `Downloading & installing pre-release CLI Core version : ${answers.pre_core_ver}`);
                  exec(`appc use ${answers.pre_core_ver}`, (err, data) => {
                    if(!err){
                      spinner_stop(true);
                      output.cyan('tick', data);
                      resolve();
                    }
                    else(reject(err));
                  });
                }
              })
            })
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              output.underline('solidarrow', 'GOING BACK TO PROD.');
              spinner_start();
              exec(`appc logout`, (err, result) => {
                if(!err){
                  resolve();
                }
                else{
                  reject(err);
                  spinner_stop(true);
                }
              });
            });
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              // output.info('solidarrow',`Setting default env to prod:`);
              exec('appc config set defaultEnvironment production', (err, result) =>{
                if(!err){
                  resolve();
                }
                else{
                  reject(err);
                  spinner_stop(true);
                }
              });
            });
          })
          .then(() => {
            return new Promise((resolve, reject) => {
              const orgIDProd = prodOrgId;
              // output.info('solidarrow', 'Logging you in:');
              exec(`appc login --username ${username} --password ${password} --org-id ${orgIDProd}`, (err, result)=> {
                if(!err){
                  spinner_stop(true);
                  output.cyan(null, result);
                  resolve();
                }
                else{reject(err);}
              });
            }); 
          })
          .catch(err => {output.error(err);});
        }
      });
    })
    .catch(err => output.error(err));
  }



  /*****************************************************************************
  * Downloads & installs the specified Appc NPM.
  ****************************************************************************/
  static appcnpm(){
    const questions = [{
      name: 'appc_npm_ver',
      type: 'input',
      message: 'Enter the Appc NPM version which you would like to download(e.g: 4.2.8) :',
      validate: (value) => {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the Appc NPM version which you would like to download.';
        }
      }
    }];
    inquirer.prompt(questions).then((answers) => {
      const version = answers.appc_npm_ver;
      output.info('solidarrow',`Downloading & installing Appc NPM version : ${version}`);
      return new Promise((resolve, reject) => {
        spinner_start();
        exec(`sudo npm install -g appcelerator@${version}`, (err, data) => {
          if(!err){
            spinner_stop(true);
            resolve(output.cyan(null ,data.trim()));
          }
          reject(err);
        });
      })
      .catch(err => {output.error(err);});
    });
  }



  /*****************************************************************************
  * Downloads & installs the specified SDK.
  ****************************************************************************/
  static installsdk(){
    let prc = '';
    return new Promise(resolve => {
      const questions = [{
        name: 'sdk_ver',
        type: 'input',
        message: 'Enter the SDK or the branch from which you would like to download the SDK(e.g: 6_0_X or SDK version) :',
        validate: function(value) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter SDK or the branch would you like to download the SDK(e.g: 6_0_X or SDK version) :';
          }
        }
      }];
      inquirer.prompt(questions).then(function(answers) {
        return answers.sdk_ver;
      })
      .then(sdkver => {
        let branch = false, arr = [];
        arr.push(sdkver);
        if((sdkver.match(/_/g))||sdkver.match(/^[A-z]/g)){
          branch = true;
          arr.push(branch);
          return arr;
        }
        else{
          arr.push(branch);
          return arr;
        }
      })
      .then(arr => {
        if(arr[1]){      //if branch
          output.info('solidarrow', `Downloading & extracting the latest SDK from branch : ${arr[0]}`);
          prc = spawn('appc', ['ti', 'sdk', 'install', '-b', arr[0], '--default', '--no-banner']);
        }
        else{             //if SDK
          output.info('solidarrow', `Downloading & extracting the SDK : ${arr[0]}`);
          prc = spawn('appc', ['ti', 'sdk', 'install', arr[0], '--default', '--no-banner']);
        }
        prc.stdout.on('data', data => {
          output.cyan(null, data.toString());
        });
        prc.stderr.on('data', data => {
          output.cyan(null, data.toString());
        });
        prc.on('error', err => {output.error(err);});
        prc.on('close', code => {resolve(output.cyan(null, 'Done\n'));});
      });
    })
    .catch(err => output.error(err));
  }



  /*****************************************************************************
  * Selects the specified SDK in CLI.
  ****************************************************************************/
  static selectsdk(){
    return new Promise((resolve,reject) => {
      const questions = [{
        name: 'sdk_ver',
        type: 'input',
        message: 'Enter the SDK version which you would like to select :',
        validate: value => {
          if (value.length) {
            return true;
          } else {
            return 'Please enter the SDK version which you would like to select.';
          }
        }
      }];
      inquirer.prompt(questions).then(answers => {
        exec(`appc ti sdk select ${answers.sdk_ver}`, (err, data) => {
          (!err)? data.includes('Configuration saved')? resolve(output.done(`SDK ${answers.sdk_ver} selected successfully.`)) : reject() : reject(err);
        });
      });
    })
    .catch(err => {output.error('SDK not found. Please enter correct SDK version.');});
  }



  /*****************************************************************************
  * Changes the env to prod or preprod.
  ****************************************************************************/
  static change_env(){
    inquirer.prompt({
      type: 'list',
      name: 'env_opt',
      message: 'Which environment would you like to be in ?',
      choices: [{
        name: 'PRODUCTION',
        value: 'production'
      },
      {
        name: 'PRE-PRODUCTION',
        value: 'preproduction'
      },
      {
        name: 'EXIT',
        value: 'exit'
      }]
    })
    .then(answers => {
      //Exit if EXIT
      if(answers.env_opt === 'exit'){
        //Quit the process
        process.exit();
      }
      else{return answers.env_opt;}
    })
    .then(env => {
      return new Promise((resolve, reject) => {
        output.underline('solidarrow','LOGGING YOU OUT:');
        exec(`appc logout`, (err, result) => {
          if(!err){
            output.cyan(null, result);
            resolve(env);
          }
          else{reject(err);}
        });
      });
    })
    .then(env => {
      return new Promise((resolve, reject) => {
        output.underline('solidarrow',`SETTING DEFAULT ENVIRONMENT TO ${env.toUpperCase()}:`);
        exec(`appc config set defaultEnvironment ${env}`, (err, result) =>{
          if(!err){
            output.cyan(null, result);
            resolve(env);
          }
          else{reject(err);}
        });
      });
    })
    .then(env => {
      return new Promise((resolve, reject) => {
        const orgID = (env === 'production')? prodOrgId : preProdOrgId;
        output.underline('solidarrow', 'LOGGING YOU IN:');
        exec(`appc login --username ${username} --password ${password} --org-id ${orgID}`, (err, result)=> {
          if(!err){
            output.cyan(null, result);
            resolve();
          }
          else{reject(err);}
        });
      });
    })
    .catch(err => {output.error(err);});
  }



  /*****************************************************************************
  * Uninstalls apps from devices & emulators
  ****************************************************************************/
  static uninstallapps(){
    return new Promise((resolve, reject) => {
      exec('appc appcd exec /android/latest/info/devices', (err, data) => {
        if(!err){resolve(data);}
        else{reject('Appc Daemon does not seem to be running. Please run appc appcd start OR restart');}
      });
    })
    .then(data => {
      const result = JSON.parse(data).message;
      let count = result.length-1;              //Substracting 1 because we are accessing array to make objects later & array starts with 0
      if(result.length > 0){                    //checking if we have atleast one device or emulator
        const deviceArr = [];
        while(count > -1){
          const deviceObj = {};
          deviceObj.name = result[count].model;
          deviceObj.id = result[count].id;
          deviceArr.push(deviceObj);
          count --;
        }
        return deviceArr;
      }
      else{
        throw('\n\u2717 No device connected.\n');
      }
    })
    .then(deviceArr => {
      return new Promise(resolve => {
        exec('adb -s emulator-5554 shell getprop', (err, data) => {
          if(!err){
            const emuName = [{name:'emulator-5554', id:'emulator-5554'}];
            deviceArr = deviceArr.concat(emuName);
            resolve(deviceArr);
          }
          else{resolve(deviceArr);}
        });
      })
      .then(deviceArr => {
        return deviceArr;
      });
    })
    .then(deviceArr => {
      return new Promise(resolve => {
        exec('adb -s 192.168.56.101:5555 shell getprop', (err, data) => {
          if(!err){
            const genyName = [{name:'192.168.56.101:5555', id:'192.168.56.101:5555'}];
            deviceArr = deviceArr.concat(genyName);
            resolve(deviceArr);
          }
          else{resolve(deviceArr);}
        });
      })
      .then(deviceArr => {
        return deviceArr;
      });
    })
    .then(deviceArr =>{
      const nameArr = [];
      deviceArr = deviceArr.concat({name:'EXIT'});  //Adding EXIT as a device & selecting it will exit node process
      deviceArr.forEach(device => {
        nameArr.push(device.name);
      });
      return new Promise((resolve) =>{
        inquirer.prompt({
          type: 'list',
          name: 'device',
          message: 'Select the device from which you want to remove apps ?',
          choices: nameArr
        })
        .then(answer => {
          if(answer.device === 'EXIT'){process.exit();}   //If EXIT is selected exit the node process
          else{
            const obj = deviceArr.find(device => {return device.name === answer.device;});
            resolve(obj);
          }
        });
      });
    })
    .then(obj => {
      return new Promise((resolve,reject) => {
        adb.getPackages(obj.id,(err, pkgs) => {
          if(!err){
            const finalObj = {}, filteredPkgs = [];
            pkgs.filter(pkg => {
              if(pkg.match(/com.app.*/g) || pkg.match(/timob/ig)){
                filteredPkgs.push(pkg);
              }
            });
            finalObj.pkgs = filteredPkgs;
            finalObj.id = obj.id;
            resolve(finalObj);
          }
          else{reject(err);}
        });
      });
    })
    .then(finalObj => {
      let count = finalObj.pkgs.length;
      if(count){
        finalObj.pkgs.forEach(pkg => {
          adb.uninstall(finalObj.id, pkg, err =>{
            if(!err){
              output.cyan('tick',`Removed package ${pkg}`);
              count --;
              if(count === 0){output.bold('tick','Done uninstalling all APPC apps\n');}
            }
            else{
              throw(err);
            }
          });
        });
      }
      else{
        output.cyanbold('No \'com.app*\' or timob packages installed on the device.');
      }
    })
    .catch((err) => output.error(err));
  }



  /*****************************************************************************
  * Imports TIMOB apps with new guid's & no services
  ****************************************************************************/
  static importapps(){
    return new Promise(resolve => {
      const questions = [{
        name: 'appname',
        type: 'input',
        message: 'Enter the app name you would like to import(app will be imported with no services):',
        validate: value => {
          if (value.length) {
            return true;
          } else {
            return 'Please enter the app name which you would like to import.';
          }
        }
      }];
      inquirer.prompt(questions).then(answers => {
        const projectPath = require('../misc/util').workspace+`/${answers.appname}`;
        if(fs.existsSync(projectPath)){
          exec(`appc new --import -d ${projectPath} --no-services`, (err, result) => {
            if(!err){
              resolve(output.cyan(null, result));
            }
            else{throw(err);}
          });
        }
        else{
          throw(`Project ${answers.appname} not found in the specified workspace. Please double check for typo.`);
        }
      })
      .catch(err => {output.error(err);});
    });
  }


  /*****************************************************************************
  * Launch Android AVD
  ****************************************************************************/
  static launchavd(){
    return new Promise(resolve => {
      let avdlist = execSync('emulator -list-avds');         //Get the list of AVD's syncronously
      avdlist = avdlist.toString().trim().split('\n');
      avdlist.push('EXIT');
      const questions = [{
        name: 'avdname',
        type: 'rawlist',
        message: 'Select an Android AVD to run from the list :',
        pageSize: avdlist.length,
        choices: avdlist
      }];
      inquirer.prompt(questions).then(answers => {
        if(answers.avdname === 'EXIT'){process.exit();}
        else{
          output.cyan('tick', `Launching android emulator: ${answers.avdname}.\n\nDONE\n`);
          let emucmd = execSync('appc ti config android.sdkPath --no-banner').toString().trim()+'/emulator',
          prc = spawn('emulator', ['-avd',`${answers.avdname}`], {  //Spawn child process passing cwd & detached option so that it can run independent of parent process
            cwd: emucmd,
            detached: true,
            stdio: 'ignore'
          });
          prc.unref();
          resolve();
        }
      });
    });
  }
}

/*****************************************************************************
* Function to get latest installed SDK from the titanium folder
****************************************************************************/
const getLatestInstalledSDKVer = () => {
  const dir = path.join(os.homedir(), 'Library', 'Application Support', 'Titanium', 'mobilesdk', 'osx'),
  folders = fs.readdirSync(dir),
  filter_arr = [];
  //filtering out DS.store file from the array of folders
  folders.filter(function(folder){
    if(folder !== '.DS_Store'){
      filter_arr.push(folder);
    }
  });
  return _.max(filter_arr, function (f) {
    const fullpath = path.join(dir, f);
    // ctime = creation time is used
    // replace with mtime for modification time
    return fs.statSync(fullpath).ctime;
  });
};

module.exports = qeutility_util;
