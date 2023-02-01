const express = require("express");
const Route = express.Router();
const Utils = require("../utils");
const nodemailer = require("nodemailer");
const cryptoJs = require("crypto-js");
const { User } = require("../database/schema/userSchema");

const emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
})

Route.get("/", (req, res) => {
    res.json({message: "Welcome to the api"});
})

Route.post("/nickname", async (req, res, next) => {
    let { nickname } = req.body;
    nickname = Utils.parseNickname(nickname);
    
    let missingParamsError = Utils.checkParamsOrReturnError({name: "nickname", value: nickname });
    if(missingParamsError) {
        return res.status(400).json(missingParamsError);
    }

    let foundUser = await User.findOne({nickname});
    if(foundUser) {
        return res.status(200).json({
            success: false,
            type: "nickname_taken",
            message: "Nickname already taken"
        })
    }
    return res.status(200).json({
        success: true,
        nickname
    })
})

Route.post("/signup", async (req, res, next) => {
    let { nickname, username, birthdate, email } = req.body;
    nickname = Utils.parseNickname(nickname);
    let code = req.query.code;
    let missingParamsError = Utils.checkParamsOrReturnError(
        { name: "nickname", value: nickname },
        { name: "username", value: username },
        { name: "birthdate", value: birthdate },
        { name: "email", value: email },
    );

    if(missingParamsError) {
        return res.status(400).json(missingParamsError);
    }

    let nickTaken = await User.findOne({nickname: nickname});
    if(nickTaken) {
        return res.status(400).json({
            success: false,
            type: "nickname_taken",
            message: "Nickname already taken"
        });
    }

    let emailTaken = await User.findOne({email});
    if(emailTaken) {
        return res.status(400).json({
            success: false,
            type: "email_taken",
            message: "Email already taken"
        });
    }

    let birthObject = birthdate.match(/(\d\d)\/(\d\d)\/(\d\d\d\d)/);
    if(!birthObject) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date format (DD/MM/YYYY)"
        });
    }
    let [, day, month, year] = birthObject;
    
    let birthDate = new Date(`${month}/${day}/${year}`);
    if(!birthDate) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date"
        });
    }

    if(!Utils.isValidDate(birthDate)) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date"
        });
    }

    if(birthDate.getTime() > new Date().getTime() || birthDate.getTime() < -2048486241) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date"
        });
    }
    
    if(!code) {
        req.session.code = Math.floor(10000 + Math.random() * 90000).toString();
        await emailTransport.sendMail({
            from: "noreply@themelens.fun",
            to: email,
            subject: "Themelens account verification code",
            html: `
            <body style="width: 350px; height: 400px; text-align: center;">
            <div style="background: black; border-radius: 15px; padding: 15px;">
            <h2 style="color: #fff; margin-bottom: 10px; margin-top: 0;">Themelens</h2>
            <span style="text-align: center; color: #777; font-size: 17px;">Hi, <strong style="color: #fff">${username}</strong>, here is your <strong style="color: #fff">themelens</strong> verification code</span>
            <h1 style="margin-top: 95px; text-align: center; color: white; letter-spacing: 15px; font-size: 55px;">${req.session.code}</h1>
            </div>
            </body>`
        })
        return res.json({success: true, await_verification: true, code: req.session.code});
    }
    
    if(req.session.code && code === req.session.code) {
        req.session.code = null;
        let newUser = new User({ nickname, email: email, username: cryptoJs.AES.encrypt(username, process.env.DB_ENCRYPT), birthdate: birthDate });
        await newUser.save();
        return res.status(200).json({success: true, await_verification: false});
    }
    else {
        return res.status(200).json({success: false, type: "invalid_code", message: "Your email code was invalid"});
    }
})

module.exports = Route;