#!/usr/bin/env node
const axios = require('axios');
const GitHubApi = require('github');
const github = new GitHubApi({ Promise: Promise });
github.authenticate({
  type: 'token',
  token: require('./grateful').TOKEN,
});
const path = require('path');
const pjson = path.join(process.cwd(), 'package.json');
const deps = require(pjson).dependencies;
const devDeps = require(pjson).devDependencies;

const allDeps = Object.keys({ ...deps, ...devDeps });

const spreadGratefulness = async () => {
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
      try {
        const starActivity = await github.activity.starRepo({
          owner,
          repo,
        });
        console.log(`${owner}/${repo} succesfully starred!`);
      } catch (err) {
        console.error(`Error: ${owner}/${repo} could not be starred :(`);
      }
    }
  } catch (err) {
    console.error('Unknown error');
  }
};

spreadGratefulness();
