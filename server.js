import dotenv from "dotenv";
import { app } from "./server/app.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 4444;

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
