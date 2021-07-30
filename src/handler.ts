import {certGenInit} from "./functions/certGenInit";
import {config as AWSConfig} from "aws-sdk";

const isOffline: boolean = (!process.env.BRANCH || process.env.BRANCH === "local");

if (isOffline) {
    AWSConfig.credentials = {
        accessKeyId: "offline",
        secretAccessKey: "offline"
    };
}

console.log("AWSConfig.credentials");
console.log(AWSConfig.credentials);

export {certGenInit as handler};
