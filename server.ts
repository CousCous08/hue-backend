import express from "express";
import { handleUpload } from "./upload/upload";
require("dotenv").config({ path: ".env.local" });

const app = express();
app.use(express.json({limit: '50mb'}));

const PORT: Number = 11112;

//upload:
app.post("/upload", handleUpload);
//lookup
app.get("/lookup", handleLookup);

// Server setup
app.listen(PORT, () => {
  console.log("HUE server is listening " + "on http://localhost:" + 11112);
});
