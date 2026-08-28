import express from "express"
import cors from "cors"

import teamRoutes from "./routes/teamRoutes.js";
import authRoutes from "../src/routes/authRoutes.js"
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth',authRoutes)
app.use('/api/teams',teamRoutes)

export default app;