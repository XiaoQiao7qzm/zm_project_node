const mongoose = require('mongoose')
let DB_URL = 'mongodb://127.0.0.1:27017/lagou'

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

let db = mongoose.connection
db.on('connected', function() {
  console.log('Mongoose connection open to ' + DB_URL);
})

db.on('error', function(err) {
  console.log('Mongoose connection error: ' + err);
})

db.on('disconnected', function() {
  console.log('Mongoose connection disconnected'); 
})

module.exports = db