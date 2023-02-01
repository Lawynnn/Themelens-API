const express = require("express");
const Route = express.Router();

Route.get("/", (req, res) => {
    res.json({message: "Welcome to the slash"});
})

module.exports = Route;