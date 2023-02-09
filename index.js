require("dotenv").config();
const express = require("express");
const session = require("express-session");
const store = require("connect-mongo");
const mongoose = require("./database");
const multer = require("multer");

const app = express()
    .use(express.json())
    .use(express.urlencoded({extended: true}))
    .use(multer().array())
    .use(session({
        secret: process.env.SESSION_TOKEN,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 30},
        resave: false,
        store: store.create(mongoose.connection)
    }))
    .use(express.static("./public"))
    .use("/api", require("./routes/api"))
    .use("/", require("./routes/slash"));

app.listen(process.env.PORT || 3000, () => console.log(`Listening on port ${process.env.PORT}`));