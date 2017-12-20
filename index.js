#!/usr/bin/env node
const chalk = require('chalk');
const axios = require('axios');
const GitHubApi = require('github');
const github = new GitHubApi({ Promise: Promise });
const token = process.env.GITHUB_TOKEN;
const path = require('path');
const pjson = path.join(process.cwd(), 'package.json');
const deps = require(pjson).dependencies;
const devDeps = require(pjson).devDependencies;

const allDeps = Object.keys({ ...deps, ...devDeps });

const spreadGratefulness = async () => {
  if (!process.env.GITHUB_TOKEN) {
    console.error(chalk.red.bold('Sorry, I need a Github token.'));
    console.warn(
      'Please run "export GITHUB_TOKEN=YOUR_TOKEN_HERE" and try again.'
    );
    return;
  }

  github.authenticate({
    type: 'token',
    token,
  });

  const starred = [];

  try {
    const allDepsInfo = await axios.post(
      'https://api.npms.io/v2/package/mget',
      allDeps
    );
    const packages = allDepsInfo.data;
    for (const item in packages) {
      const package = packages[item];
      const split = package.collected.metadata.repository.url.split('/');
      const owner = split[3];
      const repo = split[4].substring(0, split[4].lastIndexOf('.'));
      if (starred.indexOf(owner + '/' + repo) === -1) {
        try {
          const isStarred = await github.activity.checkStarringRepo({
            owner,
            repo,
          });
          // the github api return success if a repo is already starred...
          console.log(
            `👍  ${chalk.green.bold(owner + '/' + repo)} ${chalk.green(
              'was already starred... Nothing for me to do!'
            )}`
          );
          starred.push(owner + '/' + repo);
        } catch (err) {
          // and error if it's not starred yet (meaning we need to try to star it!)
          try {
            const starActivity = await github.activity.starRepo({
              owner,
              repo,
            });
            starred.push(owner + '/' + repo);
            console.log(
              `👍  ${chalk.green.bold(owner + '/' + repo)} ${chalk.green(
                'succesfully starred!'
              )}`
            );
          } catch (err) {
            console.error(
              chalk.red(
                '😕  ' + `Error: ${owner}/${repo} could not be starred :(`
              )
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('😕  ' + chalk.red.bold('Unknown error'));
  }
};

spreadGratefulness();
