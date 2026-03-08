import express from "express"
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth/auth.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/v1/auth", authRoutes)

app.get("/",(req, res)=>{
    res.send("vc-backend api is running....");
});

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`)
});