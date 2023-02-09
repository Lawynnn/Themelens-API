const express = require("express");
const Route = express.Router();
const { Auth } = require("../../middleware");
const Model = require("../../database/schema");
const multer = require("multer");
const sharp = require("sharp");
const utils = require("../../utils");

Route.get("/get/:id", Auth, async (req, res, next) => {
    let { id } = req.params;
    let user = await Model.User.findOne({ _id: id }, { token: 0, avatar: 0, email: 0, __v: 0 }).catch(e => null);
    if (!user)
        return res.status(404).json({
            success: false,
            type: "user_not_found"
        })

    res.status(200).json({
        success: true,
        user
    })
})

Route.post("/avatar/", Auth, multer({ storage: multer.memoryStorage() }).single("file"), async (req, res, next) => {
    if (!req.file)
        return res.status(400).json({
            success: false,
            type: "missing_file"
        })

    let match = req.file.mimetype.match(/image\/(png|jpeg)/);
    if (!match)
        return res.status(400).json({
            success: false,
            type: "invalid_file_type",
            current_type: req.file.mimetype
        })

    if (!req.file.buffer) {
        return res.status(400).json({
            success: false,
            type: "empty_buffer"
        })
    }

    let image = await sharp(req.file.buffer).resize({ width: 150, height: 150 }).toBuffer().catch(e => null);
    if (!image)
        return res.status(400).json({
            success: false,
            type: "cant_resize"
        })

    if (image.length > 7000)
        return res.status(400).json({
            success: false,
            type: "file_too_big",
            size: image.length,
            max_size: 7000
        })

    let saved = await Model.User.updateOne({ _id: req.user._id }, { avatar: { data: image, mimetype: req.file.mimetype } });
    if (!saved)
        return res.status(400).json({
            success: false,
            type: "failed_to_save"
        })

    res.status(200).json({
        success: true,
        size: image.length
    })
})

Route.get("/avatar/:id", async (req, res, next) => {
    let { id } = req.params;
    if (!id)
        return res.status(400).json({
            success: false,
            type: "missing_id_param"
        })

    let user = await Model.User.findOne({ _id: id }, { avatar: 1, username: 1 }).catch(e => null);
    if(!user)
        return res.status(404).json({
            success: false,
            type: "user_not_found"
        })

    if (!user.avatar?.data) {
        res.set('Content-Type', 'image/png');
        let spacedName = user.username.split(/ +/);
        let initials;
        if(spacedName.length < 2) {
            initials = (user.username.charAt(0) + user.username.charAt(1)).toUpperCase();
        }
        else initials = (spacedName[0].charAt(0) + spacedName[1].charAt(0));
        res.send(utils.imageGenerator(initials));
        return;
    }
    res.set('Content-Type', user.avatar.mimetype);
    res.send(user.avatar.data)
})

module.exports = Route;