import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import checkInRoutes from "./routes/checkins";
import friendRoutes from "./routes/friends";
import beerRoutes from "./routes/beers";
import badgeRoutes from "./routes/badges";
import rankingRoutes from "./routes/rankings";
import cheersRoutes from "./routes/cheers";
import barRoutes from "./routes/bars";
import invitationRoutes from "./routes/invitations";
import storyRoutes from "./routes/stories";
import recapRoutes from "./routes/recap";
import profileRoutes from "./routes/profile";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/checkins", checkInRoutes);
app.use("/friends", friendRoutes);
app.use("/beers", beerRoutes);
app.use("/badges", badgeRoutes);
app.use("/rankings", rankingRoutes);
app.use("/cheers", cheersRoutes);
app.use("/bars", barRoutes);
app.use("/invitations", invitationRoutes);
app.use("/stories", storyRoutes);
app.use("/recap", recapRoutes);
app.use("/profile", profileRoutes);

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok", app: "Zabrat API", version: "2.0" });
});

app.listen(PORT, () => {
  console.log(`Zabrat API running on http://localhost:${PORT}`);
});
