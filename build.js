const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fetch = require("node-fetch");

const FOUNDRY_LICENSE = process.env.FOUNDRY_LICENSE.trim().replace(/-/g, "");
const FOUNDRY_VERSION = process.env.FOUNDRY_VERSION.trim();

const EULA_VERSION = "none";
const API_KEY = "foundryvtt_hkmg5t4zxc092e31mkfbg3";

async function signLicense(key) {
    console.log("Signing license...");
    const license = {
        "host": "heroku",
        "license": key,
        "version": EULA_VERSION
    };

    let request = await fetch("https://foundryvtt.com/_api/license/sign/", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `APIKey:${API_KEY}`
        },
        method: "POST",
        body: JSON.stringify(license)
    });
    let response = await request.json();

    if (response.status !== "success") {
        throw new Error(response.message);
    }

    license.signature = response.signature;

    return license;
}


async function main() {
    const license = await signLicense(FOUNDRY_LICENSE);

    console.log("Getting download URL...");
    request = await fetch("https://foundryvtt.com/_api/license/download/", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `APIKey:${API_KEY}`
        },
        method: "POST",
        body: JSON.stringify({
            version: FOUNDRY_VERSION,
            license: license
        })
    });
    response = await request.json();

    if (!response.download) {
        throw new Error("No download URL: " + JSON.stringify(response, null, 2));
    }

    console.log(`Downloading from ${response.download}...`)
    await exec(`wget --output-document=fvtt.zip '${response.download}'`)
    console.log(`Unzipping and removing download...`)
    await exec("unzip -u fvtt.zip -d app && rm fvtt.zip")
};

main();

