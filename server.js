"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = require("./upload/upload");
const lookup_1 = require("./lookup/lookup");
const stream_1 = require("./stream/stream");
const confirmStream_1 = require("./stream/confirmStream");
require("dotenv").config({ path: ".env.local" });
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "15mb" }));
const PORT = 11112;
//upload:
app.post("/upload", upload_1.handleUpload);
//lookup
app.get("/lookup", lookup_1.handleLookup);
//stream
app.get("/stream", stream_1.handleStream);
//confirm-stream
app.post("/confirm-stream", confirmStream_1.handleConfirmStream);
// Server setup
app.listen(PORT, () => {
    console.log("HUE server is listening " + "on http://localhost:" + 11112);
});
