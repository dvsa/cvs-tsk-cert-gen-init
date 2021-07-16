import { certGenInit } from "./functions/certGenInit";
import { config as AWSConfig } from "aws-sdk";

const isOffline: boolean =
  !process.env.BRANCH || process.env.BRANCH === "local";

if (isOffline) {
  AWSConfig.credentials = {
    accessKeyId: "offline",
    secretAccessKey: "offline",
  };
}

export { certGenInit as handler };
