import express from "express";
import { handleUpload } from "./upload/upload";
require("dotenv").config({ path: ".env.local" });

const app = express();
const PORT: Number = 11112;

//upload:
app.post("/upload", handleUpload);

// Server setup
app.listen(PORT, () => {
  console.log("HUE server is listening " + "on http://localhost:" + 11112);
});
