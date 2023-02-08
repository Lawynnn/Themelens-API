const express = require("express");
const Route = express.Router();
const { Auth } = require("../../middleware");

Route.get("/", Auth, (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "work"
    })
})

module.exports = Route;