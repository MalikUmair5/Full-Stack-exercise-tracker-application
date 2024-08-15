const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let mongoose = require("mongoose");
let bodyParser = require("body-parser");

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});

let exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  _id: {
    type: String,
    required: true,
  },
});

let logSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  _id: {
    type: String,
    required: true,
  },
  log: {
    type: Array,
    required: true,
  },
});

let Users = mongoose.model("Users", userSchema);
let Exercises = mongoose.model("Exercises", exerciseSchema);
let Logs = mongoose.model("Logs", logSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/users", (req, res) => {
  let username = req.body.username;

  Users.findOne({ username: username }).then((data) => {
    if (data) {
      res.json({ username: data.username, _id: data._id });
    } else {
      let user = new Users({
        username: username,
      });
      user.save().then((data) => {
        res.json({ username: data.username, _id: data._id });
      });
    }
  });
});

app.get("/api/users", (req, res) => {
  Users.find().then((data) => {
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  Users.findById(userId).then((user) => {
    Logs.findById(userId).then((log) => {
      if (!log) {
        let log = new Logs({
          username: user.username,
          count: 1,
          _id: userId,
          log: [
            {
              description: description,
              duration: parseInt(duration),
              date: new Date(date).toDateString(),
            },
          ],
        });
        log.save().then((data) => {
          console.log("Log created successfully");
        });
      } else {
        log.count = log.count + 1;
        log.log.push({
          description: description,
          duration: parseInt(duration),
          date: new Date(date).toDateString(),
        });
        log.save().then((data) => {
          console.log("Log updated successfully");
        });
      }
    });
    Exercises.findById(userId).then((exercise) => {
      if (exercise) {
        res.json({
          // _id: exercise._id,
          username: exercise.username,
          date: exercise.date.toDateString(),
          duration: exercise.duration,
          description: exercise.description,
        });
      } else {
        let exercise = new Exercises({
          _id: user._id,
          username: user.username,
          description: description,
          duration: duration,
          date: date,
        });
        exercise.save().then((data) => {
          const response = {
            _id: data._id,
            username: data.username,
            date: data.date.toDateString(),
            duration: data.duration,
            description: data.description,
          };
          res.json(response);
        });
      }
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  let userId = req.params._id;
  let { from, to, limit } = req.query;
  Logs.findById(userId).then((data) => {
    if (data) {
      let logFormat = data.log.map((log) => {
        return {
          description: log.description,
          duration: parseInt(log.duration),
          date: new Date(log.date).toDateString(),
        };
      });
      if (from || to || limit) {
        let fromDate = new Date(0);
        let toDate = new Date();
        if (from) {
          fromDate = new Date(from);
        }
        if (to) {
          toDate = new Date(to);
        }
        logFormat = logFormat.filter((log) => {
          let logDate = new Date(log.date);
          return (
            logDate.getTime() >= fromDate.getTime() &&
            logDate.getTime() <= toDate.getTime()
          );
        });
        if (limit) {
          logFormat = logFormat.slice(0, limit);
        }
      }

      res.json({
        _id: data._id,
        username: data.username,
        count: data.count,
        log: logFormat,
      });
    } else {
      res.json({ error: "User not found" });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
