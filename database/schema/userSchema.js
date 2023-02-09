const mongoose = require("mongoose");

module.exports.User = mongoose.model(
    "users",
    new mongoose.Schema({
        username: {
            type: String,
            maxlength: 40,
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
        bio: {
            type: String,
            required: false,
            maxlength: 128,
        },
        avatar: {
            data: Buffer,
            mimetype: String,
        },
        token: {
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