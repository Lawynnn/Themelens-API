const mongoose = require("mongoose");

module.exports.User = mongoose.model(
    "users",
    new mongoose.Schema({
        username: {
            type: String,
            maxlength: 64,
            minlength: 3,
            required: true
        },
        nickname: {
            type: String,
            maxlength: 20,
            minlength: 3,
            required: true,
            unique: true
        },
        birthdate: {
            type: Date,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        lastLogin: {
            type: Date,
            default: Date.now()
        }
    })
  );