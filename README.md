# Foundry VTT on Heroku

Run Foundry Virtual Tabletop on Heroku and save data to GitHub, all for free.

## WARNING

Given that waking the Heroku server mandates a new license acceptance (since it's a different hostname), the instructions here are incompatible with the protections that are in place against license key abuse. Starting or waking the Heroku server too frequently will cause your Foundry licence to be revoked. Proceed with caution. 

## Getting started

1. Find your license code for Foundry at https://foundryvtt.com/, under your username > Purchased Licenses
1. Create a new, private GitHub repo and **add a README file** at https://github.com/new.
    * If your repo is https://github.com/username/foundry-data then `GITHUB_REPO` should be set to `username/foundry-data`.
1. Generate a new GitHub token with the `repo` scope at https://github.com/settings/tokens/new.
1. Deploy this repo on Heroku, and fill in the above details as environment variables. 
1. Every minute the server will check for changed data files (including modules, systems and worlds) and push them to your GitHub repo.
1. Enjoy your server!

## Caveats

* Invitation links from in-game settings are incorrect.
    - Instead just send your players a link to your Heroku URL.
* Heroku shuts down the server after 30 minutes with no activity.
    - As part of the free plan Heroku [servers sleep after 30 minutes of no activity](https://devcenter.heroku.com/articles/free-dyno-hours#dyno-sleeping).
* After the server sleeps an admin will need to launch a world again before players can join.
    - The license agreement needs to be accepted each time the server launches, preventing the automatic launching of a world.
* If the GitHub repo changes while the server is running it will not be able to push the changed data files.
    - If the server can't push to the `main` branch because of changes, it will create a branch called `error-` followed by a timestamp. You will then need to merge this branch with the `main` branch to continue using the saved data.
    - If the server can't create or push the `error-` branch then you will lose the last minute of changes, and the server will automatically restart in order to prevent any more data-loss.
