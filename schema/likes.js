"use strict";

const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  photo_id: mongoose.Schema.Types.ObjectId,
});

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
