import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    // origin: `http://${ip}:5173`, // Your frontend URL (adjust port if necessary)
    origin: ['http://localhost:5173',],
    credentials: true, // Allow credentials like cookies to be sent
  })
)


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import userRoute from "./routes/user.routes.js";
import assessmentRoute from "./routes/assessment.routes.js";
import doctorRoute from "./routes/doctor.routes.js";

app.use("/api/v1/users", userRoute);
app.use("/api/v1/assessments", assessmentRoute);
app.use("/api/v1/doctor", doctorRoute);

export { app };