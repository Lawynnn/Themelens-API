const express = require("express");
const Route = express.Router();
const Utils = require("../utils");
const nodemailer = require("nodemailer");
const cryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");
const { User } = require("../database/schema/userSchema");
const { Friend } = require("../database/schema/friendSchema");

const Extends = require("./extends");
Route.use("/friends", Extends.friendsRoute);
Route.use("/posts", Extends.postsRoute);
Route.use("/user", Extends.userRoute);

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
    res.json({ message: "Welcome to the api" });
})

Route.post("/nickname-validate", async (req, res, next) => {
    let { nickname } = req.body;
    nickname = Utils.parseNickname(nickname);

    let missingParamsError = Utils.checkParamsOrReturnError({ name: "nickname", value: nickname });
    if (missingParamsError) {
        return res.status(400).json(missingParamsError);
    }

    let foundUser = await User.findOne({ nickname });
    if (foundUser) {
        return res.status(200).json({
            success: false,
            type: "nickname_taken",
        })
    }
    return res.status(200).json({
        success: true,
        nickname
    })
})

Route.post("/signin", async (req, res, next) => {
    let { code } = req.query;
    let { email } = req.body;
    let { authorization } = req.headers;

    if (authorization) {
        let tokenParams = authorization.split(/ +/);
        if (tokenParams.length < 2)
            return res.status(400).json({
                success: false,
                type: "missing_access_token_type"
            })

        if (!tokenParams[0] || !tokenParams[1])
            return res.status(400).json({
                success: false,
                type: "missing_token"
            })

        if (tokenParams[0] === "Bearer") {
            let user = await User.findOne({ token: tokenParams[1] }, { avatar: 0, __v: 0 });
            if (user) {
                return res.status(200).json({
                    success: true,
                    user
                })
            }
        }

        return res.status(400).json({
            success: false,
            type: "missing_access"
        })
    }

    if (Utils.checkParamsOrReturnError(res,
        { name: "email", value: email },
    )) return;

    let user = await User.findOne({ email });
    if (!user)
        return res.status(404).json({
            success: false,
            type: "user_not_found"
        })

    if (req.session?.code && !code) {
        return res.status(400).json({ success: true, await_verification: true });
    }
    else if (!code) {
        req.session.code = Math.floor(10000 + Math.random() * 90000).toString();
        await emailTransport.sendMail({
            from: "noreply@themelens.fun",
            to: email,
            subject: "Themelens login verification code",
            html: `
                <body style="width: 350px; height: 400px; text-align: center;">
                <div style="background: black; border-radius: 15px; padding: 15px;">
                <h2 style="color: #fff; margin-bottom: 10px; margin-top: 0;">Themelens</h2>
                <span style="text-align: center; color: #777; font-size: 17px;">Hi, <strong style="color: #fff">${user.username}</strong>, here is your <strong style="color: #fff">themelens</strong> verification code</span>
                <h1 style="margin-top: 95px; text-align: center; color: white; letter-spacing: 15px; font-size: 55px;">${req.session.code}</h1>
                </div>
                </body>`
        }).catch(e => res.status(400).json({ success: false, type: "invalid_email" }));
        return res.json({ success: true, await_verification: true, code: req.session.code });
    }
    else if (code === req.session?.code) {
        req.session.code = null;
        return res.status(200).json({ success: true, await_verification: false, token: user.token });
    }
    else {
        return res.status(400).json({ success: false, type: "invalid_code" });
    }
})

Route.post("/signup", async (req, res, next) => {
    let { nickname, username, birthdate, email } = req.body;
    nickname = Utils.parseNickname(nickname);
    let code = req.query.code;
    if (Utils.checkParamsOrReturnError(res,
        { name: "nickname", value: nickname, size: [3, 20] },
        { name: "username", value: username, size: [3, 40] },
        { name: "birthdate", value: birthdate },
        { name: "email", value: email },
    )) return;

    let nickTaken = await User.findOne({ nickname: nickname });
    if (nickTaken) {
        return res.status(400).json({
            success: false,
            type: "nickname_taken",
            message: "Nickname already taken"
        });
    }

    let emailTaken = await User.findOne({ email });
    if (emailTaken) {
        return res.status(400).json({
            success: false,
            type: "email_taken",
            message: "Email already taken"
        });
    }

    let birthObject = birthdate.match(/(\d\d)\/(\d\d)\/(\d\d\d\d)/);
    if (!birthObject) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date format (DD/MM/YYYY)"
        });
    }
    let [, day, month, year] = birthObject;

    let birthDate = new Date(`${month}/${day}/${year}`);
    if (!birthDate) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date"
        });
    }

    if (!Utils.isValidDate(birthDate)) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date"
        });
    }

    if (birthDate.getTime() > new Date().getTime() || birthDate.getTime() < -2048486241) {
        return res.status(400).json({
            success: false,
            type: "invalid_birth",
            message: "Invalid birth date"
        });
    }

    if (req.session?.code && !code) {
        return res.status(400).json({ success: false, type: "already_sent" });
    }
    else if (!code) {
        req.session.code = Math.floor(10000 + Math.random() * 90000).toString();
        try {
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
            });
            return res.json({ success: true, await_verification: true, code: req.session.code });
        }
        catch (e) {
            return res.status(400).json({ success: false, type: "invalid_email" })
        }
    }
    else if (code === req.session?.code) {
        req.session.code = null;
        let token = jwt.sign(`${nickname}+${email}`, process.env.JWT_SECRET);
        let newUser = await new User({ nickname, email, username, birthdate: birthDate, token }).save();
        await new Friend({ _id: newUser._id, friends: [], pendings: [] }).save();
        return res.status(200).json({ success: true, await_verification: false, token });
    }
    else {
        return res.status(400).json({ success: false, type: "invalid_code" });
    }
})

module.exports = Route;