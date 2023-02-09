const express = require("express");
const Route = express.Router();
const { Auth } = require("../../middleware");
const Model = require("../../database/schema");

Route.get("/get/:id", Auth, async (req, res, next) => {
    let { id } = req.params;
    let user = await Model.User.findOne({_id: id}, { token: 0, avatar: 0, email: 0, __v: 0}).catch(e => null);
    if(!user)
        return res.status(404).json({
            success: false,
            type: "user_not_found"
        })
    
    res.status(200).json({
        success: true,
        user
    })
})

Route.post("/avatar/", Auth, async (req, res, next) => {
    let { image } = req.body;

    console.log(image);
    res.status(200).json({
        success: true,
    })
})

module.exports = Route;