const fs = require("fs");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const TOKEN = process.env.GITHUB_TOKEN.trim();
const REPO = process.env.GITHUB_REPO.trim();
const ADMIN_KEY = process.env.ADMIN_KEY.trim();
const FOUNDRY_LICENSE = process.env.FOUNDRY_LICENSE.trim().replace(/-/g, "");

const DATA_PATH = "/tmp/foundry-data"
const SAVE_DATA_TIME = 60000;

function init() {
    // gitignore
    fs.writeFileSync(`${DATA_PATH}/.gitignore`, [
        "*.lock",
        "Config/admin.txt",
        "Config/license.json",
        "Logs/",
    ].join("\n"));

    // config
    fs.mkdirSync(`${DATA_PATH}/Config`, { recursive: true });

    fs.writeFileSync(`${DATA_PATH}/Config/options.json`, JSON.stringify({
        proxyPort: 443,
        proxySSL: true,
        minifyStaticFiles: true
    }, null, 2));
}

async function saveData() {
    console.log("Looking for new data...");

    let output = await exec([
        `cd ${DATA_PATH}`,
        "git add --all",
        // Don't fail if there's nothing to commit
        "{ git commit --message 'Update data' || true; }"
    ].join(" && "));
    console.log(output.stdout);
    console.error(output.stderr);

    if (output.stdout.includes("nothing to commit")) {
        console.log("Skipping push");
        return;
    }

    try {
        console.log("Pushing data...")
        output = await exec(`cd ${DATA_PATH} && git push`);
        console.log(output.stdout);
        console.error(output.stderr);
    } catch (error) {
        console.error("An error occurred while pushing changes:")
        console.log(error.stdout);
        console.error(error.stderr);

        // Create a new branch and try to push that
        try {
            const branchName = `error-${Date.now()}`;
            console.log(`Creating error branch ${branchName} and pushing that:`)
            output = await exec(`cd ${DATA_PATH} && git checkout -b ${branchName} && git push --set-upstream origin ${branchName}`);
            console.log(output.stdout);
            console.error(output.stderr);
        } catch (error2) {
            console.error("DATA LOSS LIKELY! An error occurred while creating and pushing the error branch:")
            console.log(error2.stdout);
            console.error(error2.stderr);

            console.error("Exiting process in order not to lose more data. Sorry!");
            process.exit(1);
        }
    }
}

function saveDataAfterTimeout() {
    setTimeout(async () => {
        await saveData();
        saveDataAfterTimeout()
    }, SAVE_DATA_TIME);
}

async function main() {
    // clone data
    let output = await exec(`git clone https://${TOKEN}:x-oauth-basic@github.com/${REPO}.git ${DATA_PATH}`);
    console.log(output.stdout);
    console.error(output.stderr);

    // set up user for committing
    output = await exec(`cd ${DATA_PATH} && git config user.name "Foundry Server" && git config user.email "server@foundry"`);
    console.log(output.stdout);
    console.error(output.stderr);

    // init options if they don't exist
    if (!fs.existsSync(`${DATA_PATH}/Config/options.json`)) {
        init();
    }

    // license
    fs.writeFileSync(`${DATA_PATH}/Config/license.json`, JSON.stringify({
        license: FOUNDRY_LICENSE
    }, null, 2));

    // start timer to watch for data changes
    saveDataAfterTimeout();

    // https://foundryvtt.com/article/configuration/
    process.argv.push(
        // updates don't make sense on Heroku, so don't allow it
        "--noupdate",
        "--noupnp",
        `--port=${process.env.PORT}`,
        `--dataPath=${DATA_PATH}`,
        `--adminKey=${ADMIN_KEY}`
    );
    // start app
    require("./app/main");
}

main();