"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGGREGATOR_ENDPOINT = exports.PUBLISHER_ENDPOINT = exports.HUE_PACKAGE_ID = exports.ADMIN = exports.client = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const client_1 = require("@mysten/sui/client");
exports.client = new client_1.SuiClient({ url: (0, client_1.getFullnodeUrl)("testnet") });
exports.ADMIN = ed25519_1.Ed25519Keypair.deriveKeypair(process.env.WALLET_SECRET_KEY || "");
console.log("admin address: ", exports.ADMIN.toSuiAddress());
exports.HUE_PACKAGE_ID = "0xc35666ae7d8f9db5cbe15b4be2cbce36e4cab336dfdaa9d5251d9b39eb8b161a";
exports.PUBLISHER_ENDPOINT = "https://publisher.walrus-testnet.walrus.space";
exports.AGGREGATOR_ENDPOINT = "https://aggregator.walrus-testnet.walrus.space";
