const express = require("express");
const { Auth } = require("../../middleware");
const Route = express.Router();

Route.get("/", Auth, (req, res, next) => {
    
})

module.exports = Route;