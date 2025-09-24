import express from 'express';
import cors from "cors";


const app = express();


app.use(express.json({limit : "16kb"})); // to parse JSON payloads up to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // it is used to parse form data 
app.use(express.static("public")); // to serve static files

app.use(cors({
   origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:5173"],
    credentials: true, // to allow cookies to be sent with requests 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"], // allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], //
    })); // to enable CORS (Cross-Origin Resource Sharing) for all routes
 
 //import the routes
 import healthcheckRoutes from "./routes/heathcheck.routes.js";

 app.use("/api/v1/healthcheck", healthcheckRoutes);

//default route


app.get("/", (req, res) => {
  res.send("hello world");
});

export default app;
