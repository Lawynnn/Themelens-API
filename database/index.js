const mongoose = require("mongoose");

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "Themelens",
}).then(db => console.log("Connected to the database"));

module.exports = mongoose;