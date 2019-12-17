const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const url = require('url')
const { success, failed } = require('../utils/send')
const userModel = require('../models/users')

const oAuth = async (req, res, next) => {
  // console.log(req.method, '---')
  let urlObj = url.parse(req.url)
  let { pathname } = urlObj
  // console.log(pathname)
  if( 
      pathname === '/api/users/svgCaptcha' || 
      pathname === '/api/users/register' ||
      pathname === '/api/users/login'
    ) {
    next()
    return
  }
  let token = req.header('X-Access-Token')
  let publicKey = fs.readFileSync(path.resolve(__dirname, '../keygens/rsa_public_key.pem'))

  jwt.verify(token, publicKey, async (err, decoded) => {
    if(err) {
      console.error(err.message, 'token验证失败')
      res.send(failed({code: 100, data: 'token过期，请重新登陆'}))
      return
    }
    let userRes = await userModel.findOne({_id: decoded._id, username: decoded.username})
    if(userRes.token === token) {
      req.decoded = decoded
      next()
      return
    }
    res.send(failed({code: 100, data: 'token过期，请重新登陆'}))
  })
  
}

module.exports = oAuth