import express, { urlencoded } from "express"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./src/routes/auth/auth.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5175",
    credentials: true,
}));
app.use(express.json());
app.use(urlencoded({extended: true}))
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)

app.get("/",(req, res)=>{
    res.send("vc-backend api is running....");
});

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`)
});