import dotenv from "dotenv"
import app from "./app.js";

import connectDB from "./db/connection.js";


dotenv.config({
    path: "./.env",
});


 // this to start the express app

const port = process.env.PORT  ||  8080;  //
  
console.log("Starting server...");

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
