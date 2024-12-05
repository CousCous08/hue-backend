import express from "express";
import { handleUpload } from "./upload/upload";
import { handleLookup } from "./lookup/lookup";
import { handleStream } from "./stream/stream";
import { handleConfirmStream } from "./stream/confirmStream";
require("dotenv").config({ path: ".env.local" });

const app = express();
app.use(express.json({limit: "15mb"}));

const PORT: Number = 11112;

//upload:
app.post("/upload", handleUpload);
//lookup
app.get("/lookup", handleLookup);
//stream
app.get("/stream", handleStream);
//confirm-stream
app.post("/confirm-stream", handleConfirmStream)

// Server setup
app.listen(PORT, () => {
  console.log("HUE server is listening " + "on http://localhost:" + 11112);
});
