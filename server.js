import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/j9';
//const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/j9';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: String,
  role: String
});

const currentUserSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  email: String
});

const playlistSchema = new mongoose.Schema({
  _id: String,
  name: String,
  owner: String,
  shotIds: [String],
  sharedWith: [String]
});

const tagSchema = new mongoose.Schema({
  _id: String,
  tags: [String]
});

const globalTagSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  tags: [String]
});

const directorySchema = new mongoose.Schema({
  _id: String
});

const appSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  shotCovers: mongoose.Schema.Types.Mixed,
  activePlaylistId: String,
  isSidebarOpen: Boolean
});

const User = mongoose.model('User', userSchema);
const CurrentUser = mongoose.model('CurrentUser', currentUserSchema);
const Playlist = mongoose.model('Playlist', playlistSchema);
const Tag = mongoose.model('Tag', tagSchema);
const GlobalTag = mongoose.model('GlobalTag', globalTagSchema);
const AppSettings = mongoose.model('AppSettings', appSettingsSchema);
const Directory = mongoose.model('Directory', directorySchema);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/users', async (_req, res) => {
  const users = await User.find({}).lean();
  const current = await CurrentUser.findById('singleton').lean();
  res.json({ users, currentUserEmail: current ? current.email : null });
});

app.post('/api/users', async (req, res) => {
  const { users, currentUserEmail } = req.body;
  await User.deleteMany({});
  if (users?.length) await User.insertMany(users);
  await CurrentUser.findByIdAndUpdate('singleton', { email: currentUserEmail }, { upsert: true });
  res.json({ status: 'ok' });
});

app.get('/api/playlists', async (_req, res) => {
  const docs = await Playlist.find({}).lean();
  const playlists = {};
  docs.forEach(p => {
    playlists[p._id] = { id: p._id, name: p.name, owner: p.owner, shotIds: p.shotIds, sharedWith: p.sharedWith };
  });
  res.json({ playlists });
});

app.post('/api/playlists', async (req, res) => {
  const { playlists } = req.body;
  await Playlist.deleteMany({});
  const docs = Object.values(playlists || {}).map(p => ({
    _id: p.id,
    name: p.name,
    owner: p.owner,
    shotIds: p.shotIds,
    sharedWith: p.sharedWith
  }));
  if (docs.length) await Playlist.insertMany(docs);
  res.json({ status: 'ok' });
});

app.get('/api/tags', async (_req, res) => {
  const docs = await Tag.find({}).lean();
  const global = await GlobalTag.findById('singleton').lean();
  const tags = {};
  docs.forEach(t => {
    tags[t._id] = t.tags;
  });
  res.json({ tags, allGlobalTags: global ? global.tags : [] });
});

app.post('/api/tags', async (req, res) => {
  const { tags, allGlobalTags } = req.body;
  await Tag.deleteMany({});
  const docs = Object.entries(tags || {}).map(([shotId, tagArr]) => ({ _id: shotId, tags: tagArr }));
  if (docs.length) await Tag.insertMany(docs);
  await GlobalTag.findByIdAndUpdate('singleton', { tags: allGlobalTags || [] }, { upsert: true });
  res.json({ status: 'ok' });
});

app.get('/api/directories', async (_req, res) => {
  const docs = await Directory.find({}).lean();
  res.json({ directories: docs.map(d => d._id) });
});

app.post('/api/directories', async (req, res) => {
  const { directories } = req.body;
  await Directory.deleteMany({});
  const docs = (directories || []).map((name) => ({ _id: name }));
  if (docs.length) await Directory.insertMany(docs);
  res.json({ status: 'ok' });
});

app.get('/api/settings', async (_req, res) => {
  const settings = await AppSettings.findById('singleton').lean();
  if (settings) {
    res.json({
      shotCovers: settings.shotCovers,
      activePlaylistId: settings.activePlaylistId,
      isSidebarOpen: settings.isSidebarOpen
    });
  } else {
    res.json({ shotCovers: {}, activePlaylistId: null, isSidebarOpen: true });
  }
});

app.post('/api/settings', async (req, res) => {
  const { shotCovers, activePlaylistId, isSidebarOpen } = req.body;
  await AppSettings.findByIdAndUpdate(
    'singleton',
    { shotCovers, activePlaylistId, isSidebarOpen },
    { upsert: true }
  );
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
