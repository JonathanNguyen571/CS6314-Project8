/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the project6 collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");

const fs = require("fs");

const express = require("express");
const app = express();

const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");
const Like = require("./schema/likes.js");

const processFormBody = multer({ storage: multer.memoryStorage() }).single("uploadedphoto");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: false
}));

app.use(bodyParser.json());
app.use(express.static(__dirname));

// API for logging in user /admin/login
app.post('/admin/login', async (request, response) => {
  const { login_name, password } = request.body;

  if (!login_name || !password) {
      return response.status(400).json({ message: 'Login name and password are required.' });
  }

  try {
      const user = await User.findOne({ login_name });

      if (!user) {
          console.log(`Login name "${login_name}" does not exist.`);
          return response.status(400).json({ message: `Login name "${login_name}" does not exist. Please try again.` });
      } else if (user.password !== request.body.password) {
          console.log('Password is incorrect.');
          return response.status(400).json({ message: 'Password is incorrect. Please try again.' });
      }

      console.log('User login success!');
      request.session.userIdRecord = user._id;

      return response.status(200).json({
          first_name: user.first_name,
          _id: user._id
      });

  } catch (error) {
      console.error(`Error occurred: ${error}`);
      return response.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

// API for logging out user /admin/logout
app.post('/admin/logout', (request, response) => {
  if (!request.session.userIdRecord) {
      return response.status(400).json({ message: "User is not logged in" });
  }

  request.session.destroy(err => {
      if (err) {
          console.error("Error in destroying the session", err);
          return response.status(400).send();
      }

      console.log("Session destroyed successfully");
      return response.status(200).send();
  });

  return response.status(200).send();
});

// Helper method
function hasSessionRecord(request, response, next) {
  if (request.session.userIdRecord) {
      console.log("Session: Active user detected");
      return next();
  }

  console.log("Session: No active user found");
  return response.status(401).json({ message: 'Unauthorized' });
}

// Stores comments in database
app.post('/commentsOfPhoto/:photo_id', hasSessionRecord, async (request, response) => {
  const commentText = request.body.comment;

  if (!commentText.trim()) {
      return response.status(400).json({ message: "Empty comment is not allowed" });
  }

  try {
      const photo = await Photo.findById(request.params.photo_id);

      if (!photo) {
          return response.status(400).json({ message: "Photo not found" });
      }

      const commentObj = {
          comment: commentText,
          date_time: new Date().toISOString(),
          user_id: request.session.userIdRecord
      };

      photo.comments = photo.comments || [];
      photo.comments.push(commentObj);
      await photo.save();

      console.log("** Server: Comment added to photo! **");
      return response.status(200).send();
  } catch (error) {
      console.error('Error Finding Photo with Photo ID', error);
      return response.status(400).json({ message: "An error occurred" });
  }
});



// Deals with photo uploading
app.post('/photos/new', hasSessionRecord, (request, response) => {
  processFormBody(request, response, err => {
      if (err || !request.file) {
          console.error("Error processing photo received from request", err);
          return response.status(400).json({ message: "Error processing photo" });
      }

      if (request.file.buffer.length === 0) {
          return response.status(400).json({ message: 'Error: Uploaded photo is empty' });
      }

      const timestamp = Date.now();
      const filename = `U${timestamp}${request.file.originalname}`;

      fs.writeFile(`./images/${filename}`, request.file.buffer, error => {
          if (error) {
              console.error("Error writing photo data to images directory", error);
              return response.status(500).json({ message: 'Failed to save photo' });
          }
          console.log("** Server: Photo saved in the directory **");
          return response.status(200).send();
      });

      Photo.create({
          file_name: filename,
          date_time: timestamp,
          user_id: request.session.userIdRecord
      })
      .then(() => {
          console.log("** Server: Photo saved in the DB **");
          return response.status(200).send();  // Successfully stored the photo
      })
      .catch(e => {
          console.error(`Error saving photo to DB: ${e}`);
          return response.status(500).json({ message: 'Failed to save photo to the database' });
      });

      return Photo;
  });
});

// Creates a new user with the provided details. Validates the input and returns the created user's information.
app.post('/user', (request, response) => {
  console.log("Received request body:", request.body);
  const newUser = request.body;

  // Validate: first_name, last_name, and password must be non-empty strings
  if (!newUser.first_name || !newUser.last_name || !newUser.password) {
    return response.status(400).json({
      message: "The first_name, last_name, and password must be non-empty strings"
    });
  }

  // Check if the user already exists based on login_name
  User.findOne({ login_name: newUser.login_name })
    .then(user => {
      if (user) {
        // User exists
        console.log("User already exists with login name:", newUser.login_name);
        return response.status(400).json({
          message: "The login name already exists, please choose a different login name"
        });
      }

      // User does not exist, create new user
      return User.create(newUser) // Ensure this is returned
        .then(createdUser => {
          console.log("New user created in the database with login name:", createdUser.login_name);
          return response.status(200).json({
            message: "User created successfully!",
            login_name: createdUser.login_name // Include login_name in the response
          });
        });
    })
    .catch(error => {
      console.error("Error checking or creating user:", error);
      return response.status(500).json({
        message: "Error checking user existence or creating user"
      });
    });

    return newUser;
});


app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

// Fetch /test/:p1 endpoints
app.get("/test/:p1", async function (request, response) {
  const param = request.params.p1 || "info";

  if (param === "info") {
    try {
      const info = await SchemaInfo.find({});
      if (info.length === 0) return response.status(500).send("Missing SchemaInfo");
      return response.json(info[0]);
    } catch (err) {
      console.error("Error in /test/info:", err);
      return response.status(500).json(err);
    }
  } else if (param === "counts") {
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];

    try {
      await Promise.all(
        collections.map(async (col) => {
          col.count = await col.collection.countDocuments({});
          return col;
        })
      );

      const counts = collections.reduce((obj, col) => {
        obj[col.name] = col.count;
        return obj;
      }, {});

      return response.json(counts);
    } catch (err) {
      return response.status(500).json(err);
    }
  } else {
    return response.status(400).send("Bad param " + param);
  }
});



// Retrieves a list of all users. Supports optional query parameters for filtering and pagination.
app.get('/user/list', hasSessionRecord, async (request, response) => {
  try {
      const users = await User.find({}, 'first_name last_name _id').exec();
      response.status(200).json(users);
  } catch (error) {
      console.error('Error retrieving user list:', error);
      response.status(500).json({ message: 'An error occurred while retrieving users.' });
  }
});


// Fetches details of a specific user by their unique ID. Returns user details or an error if not found.
app.get("/user/:id", hasSessionRecord, async function (request, response) {
  const id = request.params.id;
  try {
    const user = await User.findById(id, "_id first_name last_name location description occupation");
    if (!user) return response.status(404).send(`User with _id: ${id} not found`);
    return response.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return response.status(400).send("Invalid ID format");
  }
});

// Retrieves the photos of the user based on their ID
app.get("/photosOfUser/:id", hasSessionRecord, async function (request, response) {
  const id = request.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).send("Invalid user ID format");
    }

    const photos = await Photo.find({ user_id: id }).select('_id user_id file_name date_time comments');

    if (photos.length === 0) return response.status(200).send([]);

    const userIds = photos.flatMap(photo => photo.comments.map(comment => comment.user_id));
    const users = await User.find({ _id: { $in: userIds } }).select('_id first_name last_name').lean();
    const userMap = Object.fromEntries(users.map(user => [user._id.toString(), user]));

    const likes = await Promise.all(
      photos.map(photo => Like.find({ photo_id: photo._id }))
    );
    

    const formattedPhotos = photos.map((photo, index) => ({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      likes: likes[index],
      comments: photo.comments.map(comment => {
        const user = userMap[comment.user_id.toString()];
        return {
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          user: user ? { _id: user._id, first_name: user.first_name, last_name: user.last_name } : {}
        };
      })
    }));

    // Sort photos by number of likes
    formattedPhotos.sort((a, b) => b.likes.length - a.likes.length);

    return response.status(200).json(formattedPhotos);
  } catch (error) {
    console.error("Error fetching photos for user:", id, error);
    return response.status(500).send("Internal server error");
  }
});

// Retrieve the details of the user based on their ID 
app.get('/user/details/:id', hasSessionRecord, async (request, response) => {
  const userId = request.params.id;

  try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return response.status(400).send("Invalid user ID format");
      }

      // Fetch all photos for the user
      const photos = await Photo.find({ user_id: userId }).select('_id file_name date_time comments');

      if (!photos.length) {
          return response.status(200).json({
              recentPhoto: null,
              mostCommentedPhoto: null
          });
      }

      // Determine the most recent photo
      const recentPhoto = photos.reduce((latest, photo) => {
        return (!latest || photo.date_time > latest.date_time) ? photo : latest;
      }, null);

      const recentPhotoLikes = await Like.find({ photo_id: recentPhoto._id });

      // Determine the most commented photo
      const mostCommentedPhoto = photos.reduce((most, photo) => {
        return (!most || photo.comments.length > most.comments.length) ? photo : most;
      }, null);


      const mostCommentedPhotoLikes = await Like.find({ photo_id: mostCommentedPhoto._id });

      // Format the response
      return response.status(200).json({
          recentPhoto: recentPhoto
              ? { _id: recentPhoto._id, file_name: recentPhoto.file_name, date_time: recentPhoto.date_time, likes: recentPhotoLikes }
              : null,
          mostCommentedPhoto: mostCommentedPhoto
              ? { _id: mostCommentedPhoto._id, file_name: mostCommentedPhoto.file_name, commentCount: mostCommentedPhoto.comments.length, likes: mostCommentedPhotoLikes }
              : null
      });
  } catch (error) {
      console.error("Error fetching user details:", error);
      return response.status(500).send("Internal server error");
  }
});

// Retrieves the data on who mentioned the user
app.get('/userMentions/:id', async function (request, response) {
  try {
    const userId = request.params.id;

    // Find photos mentioning the user
    const photos = await Photo.find({ mentions: userId });
    if (!photos || photos.length === 0) {
      return response.status(404).send('No photos found mentioning the user.');
    }

    // Gather details for each photo
    const mentionedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const owner = await User.findById(photo.user_id);
        return {
          file_name: photo.file_name,
          owner_id: photo.user_id,
          owner_name: owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown',
        };
      })
    );

    return response.status(200).send(mentionedPhotos);
  } catch (err) {
    console.error('Error in /userMentions/:id:', err);
    return response.status(500).send('Internal server error.');
  }
});


//Retrieves the user photos based on the location of where the user was mentioned
app.post('/photosOfUser/mentions', async function (request, response) {
  try {
    const { user_id_arr: mentionedUsersIdArr, photoId } = request.body;

    // Validate request body
    if (!photoId || !mentionedUsersIdArr || !Array.isArray(mentionedUsersIdArr)) {
      console.error("Invalid request body:", request.body);
      return response.status(400).send('Invalid request body.');
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      console.error("Photo not found for ID:", photoId);
      return response.status(404).send('Photo not found.');
    }

    console.log("Photo before updating mentions:", photo);

    // Add unique user IDs to mentions array
    const uniqueMentions = new Set(photo.mentions); // Existing mentions
    mentionedUsersIdArr.forEach((userId) => {
      uniqueMentions.add(userId);
    });

    photo.mentions = Array.from(uniqueMentions); // Convert Set back to Array
    await photo.save();

    console.log("Photo after updating mentions:", photo);
    return response.status(200).json({ message: 'Mentions successfully registered.', mentions: photo.mentions });
  } catch (err) {
    console.error('Error in /photosOfUser/mentions:', err);
    return response.status(500).send('Internal server error.');
  }
});

// Deletes a photo identified by its unique ID. Ensures the photo exists and verifies user permissions.
app.delete("/photos/:id", hasSessionRecord, async function(request, response) {
  const id = request.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).send("Invalid photo ID format");
    }

    const photo = await Photo.findById(id);
    if (!photo) return response.status(404).send(`Photo with _id: ${id} not found`);

    if (!photo.user_id.equals(request.session.userIdRecord)) {
      console.log("User with id: ", request.session.userIdRecord, "is not authorized to delete photo with id: ", id);
      return response.status(403).send("You are not authorized to delete this photo");
    }

    // Delete all likes associated with the photo
    await Like.deleteMany({photo_id: id});

    // Delete the photo
    await Photo.deleteOne({ _id: id });
    console.log("Photo deleted successfully");

    return response.status(200).send();
  } catch (error) {
    console.error("Error deleting photo:", error);
    return response.status(500).send("Internal server error");
  }
});

// This id corresponds to the comment_id but we need to find the corresponding photo
app.delete("/comments/:id", hasSessionRecord, async function (request, response) {
  const id = request.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).send("Invalid comment ID format");
    }

    // Find the photo containing the comment
    const photo = await Photo.findOne({ comments: { $elemMatch: { _id: id } } });
    if (!photo) {
      return response.status(404).send(`Photo with comment_id: ${id} not found`);
    }

    // Find the comment to delete
    const commentToDelete = photo.comments.find(comment => comment._id.toString() === id);
    if (!commentToDelete) {
      return response.status(404).send("Comment not found in photo");
    }

    // Remove the comment
    photo.comments = photo.comments.filter(comment => comment._id.toString() !== id);

    // Update the mentions array
    const updatedMentions = new Set();

    // Recalculate mentions from remaining comments
    photo.comments.forEach(comment => {
      if (comment.mentions) {
        comment.mentions.forEach(userId => updatedMentions.add(userId));
      }
    });

    // Assign recalculated mentions back to photo
    photo.mentions = Array.from(updatedMentions);

    // Save changes to the photo
    await photo.save();

    return response.status(200).send({ message: "Comment and mentions updated successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return response.status(500).send("Internal server error");
  }
});


// Deletes the user account and all of its associated information. 
app.delete('/user/me', hasSessionRecord, async function (request, response) {
  const id = request.session.userIdRecord;

  try {
    // Delete all photos associated with the user
    await Photo.deleteMany({ user_id: id });

    // Find photos with comments by the user
    const photos = await Photo.find({ comments: { $elemMatch: { user_id: id } } });

    // Remove user comments from all relevant photos in parallel
    await Promise.all(
      photos.map(async (photo) => {
        photo.comments = photo.comments.filter(comment => comment.user_id.toString() !== id);
        await photo.save();
      })
    );

    // Delete the user
    await User.deleteOne({ _id: id });

    // Destroy the session and send a response
    return request.session.destroy(() => {
      response.status(200).send();
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return response.status(500).send('Internal server error.');
  }
});


// Either like or unlike a photo
app.post('/photos/:id/like', hasSessionRecord, async function(request, response) {
  const photoId = request.params.id;
  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    return response.status(400).send("Invalid photo ID format");
  }

  const like = await Like.findOne({user_id: request.session.userIdRecord, photo_id: photoId});
  // If the user has already liked the photo, unlike it
  if (like) {
    await Like.deleteOne({user_id: request.session.userIdRecord, photo_id: photoId});
    return response.status(200).send();
  }
  // If the user has not liked the photo, like it
  await Like.create({user_id: request.session.userIdRecord, photo_id: photoId});
  return response.status(200).send();
});


app.listen(3000, function () {
  console.log(`Listening at http://localhost:3000 exporting the directory ${__dirname}`);
});
