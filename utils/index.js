module.exports.checkParamsOrReturnError = (...params) => {
    let error = null;
    for(let param of params) {
        if(!param.value) {
            error = {
                success: false,
                type: "missing_param",
                param: param.name,
                message: `Parameter ${param.name} is missing.`
            }
        }
    }
    return error;
}

module.exports.parseNickname = (nickname) => {
    let fixedNick = "";
    if(nickname) {
        nickname = nickname.toLowerCase().replace(/ +/g, "_");
        nickname = nickname.replace(/[a-zA-Z0-9\_\.]/g, (v, y, z) => {
            fixedNick += v;
        });
    }
    return fixedNick;
}

module.exports.isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
}