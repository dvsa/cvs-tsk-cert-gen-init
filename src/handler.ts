import { certGenInit } from "./functions/certGenInit";
import {
  PutSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const isOffline: boolean =
  !process.env.BRANCH || process.env.BRANCH === "local";

if (isOffline) {
  const SMC = new SecretsManagerClient({});

  const command = new PutSecretValueCommand({
    SecretId: "secretid1",
    SecretString: JSON.stringify({
      accessKeyId: "offline",
      secretAccessKey: "offline",
    }),
  });

  SMC.send(command);
}

export { certGenInit as handler };
