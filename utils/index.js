const Canvas = require("canvas");
const colorConvert = require("color-convert");

module.exports.checkParamsOrReturnError = (res, ...params) => {
    let error = null;
    for (let param of params) {
        if (!param.value) {
            error = {
                success: false,
                type: "missing_param",
                param: param.name,
            }
        }
        else if (param.size && (param?.size[0] > param.value?.length || param?.size[1] < param.value?.length)) {
            error = {
                success: false,
                type: "length_mismatch",
                param: param.name,
                size: param.size
            }
        }
    }
    if (error)
        res.status(400).json(error);
    return error;
}

module.exports.parseNickname = (nickname) => {
    let fixedNick = "";
    if (nickname) {
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

module.exports.imageGenerator = (initials) => {
    const colorGroups = [
        "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
        "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
        "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6", "#f39c12",
        "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d", "#dddddd",
        "#fcdb03", "#03f8fc", "#262624"
    ];

    const canvas = Canvas.createCanvas(200, 200);
    const ctx = canvas.getContext("2d");

    const firstLetterIndex = "abcdefghijklmnopqrstuvwxyz".indexOf(initials[0].toLowerCase());
    const groupIndex = firstLetterIndex >= 0 ? firstLetterIndex % colorGroups.length : 0;

    const color = colorGroups[groupIndex];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const hsl = colorConvert.hex.hsl(color);
    const textColor = hsl[2] > 50 ? "black" : "white";

    ctx.font = "70px sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, canvas.width / 2, canvas.height / 2);

    const imageBuffer = canvas.toBuffer();
    return imageBuffer;
}