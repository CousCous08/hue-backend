"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLISHER_ENDPOINT = exports.HUE_PACKAGE_ID = exports.ADMIN = exports.client = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const client_1 = require("@mysten/sui/client");
const rpcUrl = (0, client_1.getFullnodeUrl)("testnet");
exports.client = new client_1.SuiClient({ url: rpcUrl });
exports.ADMIN = ed25519_1.Ed25519Keypair.deriveKeypair(process.env.WALLET_SECRET_KEY || "");
exports.HUE_PACKAGE_ID = "0x934718b8127861046d6cf9a8b8c0655d6558e0193f6a108ccd0c565491df24bf";
exports.PUBLISHER_ENDPOINT = "https://publisher.walrus-testnet.walrus.space";
