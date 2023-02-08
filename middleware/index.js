const mongoose = require("mongoose");
const { User } = require("../database/schema/userSchema"); 

/**
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
module.exports.Auth = async (req, res, next) => {
    const { authorization } = req.headers;
    
    if(!authorization) 
        return res.status(403).json({
            success: false,
            type: "missing_access"
        })
    
    let tokenParams = authorization.split(/ +/);
    if(tokenParams.length < 2) 
        return res.status(400).json({
            success: false,
            type: "missing_access_token_type"
        })
    
    if(!tokenParams[0] || !tokenParams[1])
        return res.status(400).json({
            success: false,
            type: "missing_token"
        })
    
    if(tokenParams[0] === "Bearer") {
        let user = await User.findOne({token: tokenParams[1]});
        if(user) {
            req.user = user;
            return next();
        }
    }

    return res.status(403).json({
        success: false,
        type: "missing_access"
    });
}