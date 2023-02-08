const express = require("express");
const Route = express.Router();
const { Auth } = require("../../middleware");
const Model = require("../../database/schema");


Route.get("/", Auth, async (req, res, next) => {
    let userFriend = await Model.Friend.findOne({ _id: req.user._id });
    if (!userFriend)
        return res.status(400).json({
            success: false,
            type: "no_friends_db"
        })

    let data = userFriend.friends.map(u => u._id);
    res.status(200).json({
        success: true,
        friends: data,
    })
})

Route.get("/pendings", Auth, async (req, res, next) => {
    let userFriend = await Model.Friend.findOne({ _id: req.user._id });
    if (!userFriend)
        return res.status(400).json({
            success: false,
            type: "no_friends_db"
        })

    let data = userFriend.pendings.map(u => u._id);
    res.status(200).json({
        success: true,
        pendings: data,
    })
})

Route.get("/search", Auth, async (req, res, next) => {
    let { query } = req.query;
    if (!query) {
        return res.status(400).json({
            type: "missing_query",
            success: false,
        });
    }

    let selfFriends = await Model.Friend.findOne({ _id: req.user._id });
    if (!selfFriends) {
        return res.status(400).json({
            success: false,
            type: "no_friends_db",
        });
    }

    let findUsers = await Model.User.find({
        nickname: {
            $regex: decodeURIComponent(query),
            $options: "i",
        },
    }, { token: 0, avatar: 0, email: 0, __v: 0}).limit(20);

    async function getMutuals(uid) {
        let userFriends = await Model.Friend.findOne({ _id: uid }).catch((e) => null);
        if (!userFriends) return [];

        let data = [];
        let friends = userFriends.friends;
        let myFriends = selfFriends.friends;
        for (let friend of friends) {
            if (myFriends.includes(friend)) {
                data.push(friend);
            }
        }
        return data;
    }

    let results = await Promise.all(
        findUsers.map(async (u) => {
            return { ...u.toObject(), mutuals: await getMutuals(u._id) };
        })
    );

    res.status(200).json({
        success: true,
        results: results,
    });
})

Route.post("/send/:id", Auth, async (req, res, next) => {
    let { id } = req.params;
    if (!id)
        return res.status(400).json({
            success: false,
            type: "missing_url_param"
        });

    if (req.user._id.toString() === id.toString())
        return res.status(400).json({
            success: false,
            type: "cant_send_self_request"
        });

    let [thisFriend, userFriend] = await Promise.all([
        Model.Friend.findOne({ _id: id }).catch(e => null),
        Model.Friend.findOne({ _id: req.user._id })
    ]);

    if (!thisFriend)
        return res.status(400).json({
            success: false,
            type: "user_not_found"
        });

    if (!userFriend)
        return res.status(400).json({
            success: false,
            type: "user_not_found"
        });

    if (userFriend.friends.includes(id))
        return res.status(400).json({
            success: false,
            type: "already_friends"
        });

    if (userFriend.pendings.includes(id))
        return res.status(400).json({
            success: false,
            type: "already_pending"
        });

    userFriend.pendings.push(id);
    await userFriend.save();
    return res.json({
        success: true,
        type: "friend_request_sent"
    });
});

Route.post("/accept/:id", Auth, async (req, res, next) => {
    let { id } = req.params;
    if (!id)
        return res.status(400).json({
            success: false,
            type: "missing_url_param"
        });

    let thisFriend = await Model.Friend.findOne({ _id: id }).catch(e => null);
    if (!thisFriend)
        return res.status(400).json({
            success: false,
            type: "user_not_found"
        });

    let userFriend = await Model.Friend.findOne({ _id: req.user._id });
    if (!userFriend)
        return res.status(400).json({
            success: false,
            type: "user_not_found"
        });

    if (userFriend.friends.includes(id))
        return res.status(400).json({
            success: false,
            type: "already_friends"
        });

    if (!userFriend.pendings.includes(id))
        return res.status(400).json({
            success: false,
            type: "not_pending"
        });

    if (!thisFriend.pendings.includes(req.user._id))
        return res.status(400).json({
            success: false,
            type: "not_pending"
        });

    userFriend.pendings.pull(id);
    userFriend.friends.push(id);
    thisFriend.pendings.pull(req.user._id);
    thisFriend.friends.push(req.user._id);

    await userFriend.save();
    await thisFriend.save();

    return res.status(200).json({
        success: true,
        type: "friends"
    });
});

module.exports = Route;