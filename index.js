const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

let users;
let exercises;

async function connectToDatabase() {
  try {
    const client = await mongoose.connect(process.env.MONGO_URI);
    const db = client.connection;
    users = db.collection('users');
    exercises = db.collection('exercises');
  }
  catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connectToDatabase();

const userSchema = new mongoose.Schema({
  username: String
});
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  user_id: String
});

// Try to perform CRUD operations on the model instead of the collections directly
const userModel = mongoose.model('users', userSchema);
const exerciseModel = mongoose.model('exercises', exerciseSchema);

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const user = await users.findOne({ username: username });
  // Don't add duplicate usernames
  if (user) {
    res.json({ username: user.username, _id: user._id });
  }
  else {
    try {
      const newUser = new userModel({ username: username });
      const result = await newUser.save();
      res.json(result);
    }
    catch (err) {
      console.error('Error saving user:', err);
    }
  }
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  const _id = req.params._id;
  const { description, duration, date } = req.body;
  try {
    const user = await userModel.findOne({ _id: _id });
    // If user exists, add exercise
    if (user) {
      const newExercise = new exerciseModel({
        username: user.username,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date(),
        user_id: user._id
      });
      const exercise = await newExercise.save().catch(error => {
        console.error('Error saving user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      });
      res.json({
        username: exercise.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
        _id: exercise.user_id
      });
    };
  }
  catch (err) {
    console.log(err);
    res.send('There was an error saving the exercise');
  }
});

app.get('/api/users', async (req, res) => {
  const userList = await userModel.find({});
  return res.json(userList);
});

app.get('/api/users/:_id/logs', async (req, res) => {
  //?[from][&to][&limit]
  const _id = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;

  try {
    const user = await userModel.findOne({ _id: _id });
    const exerciseCount = await exerciseModel.countDocuments({ user_id: _id });
    // Find Filter for ID & Dates
    let filter = { user_id: _id };
    // Exclude the whole variable if neither date options are provided.
    if (from || to) {
      filter.date = {};
    }
    if (from) {
      filter.date.$gte = from;
    }
    if (to) {
      filter.date.$lte = to;
    }

    const exerciseList = await exerciseModel.find(filter).limit(limit);

    // Format each exercise in the list
    const formattedExercises = exerciseList.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    }));

    res.json(
      {
        username: user.username,
        count: exerciseCount,
        _id: user._id,
        log: formattedExercises
      }
    );
  }
  catch (err) {
    console.error('Error getting User\'s exercises:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
