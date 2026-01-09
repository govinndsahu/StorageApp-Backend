import "dotenv/config";
import express from "express";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUserDirRoutes from "./routes/adminUserDirRoutes.js";
import adminUserFileRoutes from "./routes/adminUserFileRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import cors from "cors";
import { CheckAuth } from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";

await connectDB();

const app = express();
const port = 4001;

const whitelist = [
  process.env.CLIENT_URL,
  "https://storageapp.govindsahu.me",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(helmet());

app.use(cookieParser(process.env.COOKIE_PARSER_SESSION_KEY));

app.use(express.json());

app.use(express.static("storage"));

app.get("/", (req, res) => {
  return res.json({
    message: "Hello StorageApp Test Mode!!",
  });
});

app.use("/webhooks", webhookRoutes);

app.use("/directory", CheckAuth, directoryRoutes);

app.use("/file", CheckAuth, fileRoutes);

app.use("/", userRoutes);

app.use("/", adminRoutes);

app.use("/admin", CheckAuth, adminUserDirRoutes);

app.use("/admin", CheckAuth, adminUserFileRoutes);

app.use("/public", publicRoutes);

app.use("/", CheckAuth, subscriptionRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  // console.log(
  //   err.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied[0].details
  // );
  return res.status(err.status || 500).json({
    error: "Something went wrong",
  });
});

app.listen(port, () => {
  console.log("Server is running on port 4000");
});
