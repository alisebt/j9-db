import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/j9';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  users: [{ email: String, name: String, role: String }],
  currentUserEmail: String
});

const appStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  playlists: mongoose.Schema.Types.Mixed,
  tags: mongoose.Schema.Types.Mixed,
  allGlobalTags: [String],
  shotCovers: mongoose.Schema.Types.Mixed,
  activePlaylistId: String,
  isSidebarOpen: Boolean
});

const UserState = mongoose.model('UserState', userStateSchema);
const AppState = mongoose.model('AppState', appStateSchema);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/user-state', async (_req, res) => {
  const state = await UserState.findById('singleton');
  if (state) {
    res.json({ users: state.users, currentUserEmail: state.currentUserEmail });
  } else {
    res.json({ users: [], currentUserEmail: null });
  }
});

app.post('/api/user-state', async (req, res) => {
  const { users, currentUserEmail } = req.body;
  await UserState.findByIdAndUpdate('singleton', { users, currentUserEmail }, { upsert: true });
  res.json({ status: 'ok' });
});

app.get('/api/app-state', async (_req, res) => {
  const state = await AppState.findById('singleton');
  if (state) {
    res.json({
      playlists: state.playlists,
      tags: state.tags,
      allGlobalTags: state.allGlobalTags,
      shotCovers: state.shotCovers,
      activePlaylistId: state.activePlaylistId,
      isSidebarOpen: state.isSidebarOpen
    });
  } else {
    res.json({ playlists: {}, tags: {}, allGlobalTags: [], shotCovers: {}, activePlaylistId: null, isSidebarOpen: true });
  }
});

app.post('/api/app-state', async (req, res) => {
  const { playlists, tags, allGlobalTags, shotCovers, activePlaylistId, isSidebarOpen } = req.body;
  await AppState.findByIdAndUpdate(
    'singleton',
    { playlists, tags, allGlobalTags, shotCovers, activePlaylistId, isSidebarOpen },
    { upsert: true }
  );
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
