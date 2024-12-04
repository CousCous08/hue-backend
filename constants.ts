import dotenv from 'dotenv';
dotenv.config();

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
export const client = new SuiClient({ url: getFullnodeUrl("testnet") });
export const ADMIN = Ed25519Keypair.deriveKeypair(
  process.env.WALLET_SECRET_KEY || ""
);
console.log("admin address: ", ADMIN.toSuiAddress());
export const HUE_PACKAGE_ID =
  "0xc35666ae7d8f9db5cbe15b4be2cbce36e4cab336dfdaa9d5251d9b39eb8b161a";
export const PUBLISHER_ENDPOINT = "https://publisher.walrus-testnet.walrus.space";
