module.exports.checkParamsOrReturnError = (res, ...params) => {
    let error = null;
    for(let param of params) {
        if(!param.value) {
            error = {
                success: false,
                type: "missing_param",
                param: param.name,
            }
        }
        else if(param.size && (param?.size[0] > param.value?.length || param?.size[1] < param.value?.length)) {
            error = {
                success: false,
                type: "length_mismatch",
                param: param.name,
                size: param.size
            }
        }
    }
    if(error)
        res.status(400).json(error);
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