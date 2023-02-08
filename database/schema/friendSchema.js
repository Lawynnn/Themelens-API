const mongoose = require("mongoose");

module.exports.Friend = mongoose.model(
    "friends",
    new mongoose.Schema({
        _id: { type: mongoose.Types.ObjectId, ref: "users" },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "users"
        }],
        pendings: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "users"
        }]
    })
  );