import dotenv from 'dotenv';
dotenv.config();

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
const rpcUrl = getFullnodeUrl("testnet");
export const client = new SuiClient({ url: rpcUrl });
export const ADMIN = Ed25519Keypair.deriveKeypair(
  process.env.WALLET_SECRET_KEY || ""
);
export const HUE_PACKAGE_ID =
  "0x934718b8127861046d6cf9a8b8c0655d6558e0193f6a108ccd0c565491df24bf";
export const PUBLISHER_ENDPOINT = "https://publisher.walrus-testnet.walrus.space";
