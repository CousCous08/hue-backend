"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = require("./upload/upload");
require("dotenv").config({ path: ".env.local" });
const app = (0, express_1.default)();
const PORT = 11112;
//upload:
app.post("/upload", upload_1.handleUpload);
// Server setup
app.listen(PORT, () => {
    console.log("HUE server is listening " + "on http://localhost:" + 11112);
});
