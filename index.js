import dotenv from "dotenv";
import { connect } from "./src/db/index.js";
import { app } from "./src/app.js";

const port = process.env.PORT || 3000;

dotenv.config({
  path: "./.env",
});

connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on ${port}`);
    });
  })
  .catch((err) => {
    console.log(`MONGODB CONNECTION FAILED: ${err}`);
  });
