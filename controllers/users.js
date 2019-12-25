const userModel = require('../models/users')
const bcrypt = require('bcryptjs')
const { success, failed } = require('../utils/send')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const svgCaptcha = require('svg-captcha')
const multiparty = require('multiparty')

class UsersController {
  constructor() {
    
  }
  // 密码加密
  _hashPassword(pwd) {
    return new Promise((res) => {
      let salt = bcrypt.genSaltSync(10)
      let hash = bcrypt.hashSync(pwd, salt)
      res(hash)
    })
  }
  //密码比对
  _comparePassword(pwd, hash) {
    return new Promise((res) => {
      let compareRes = bcrypt.compareSync(pwd, hash)
      res(compareRes)
    })
  }
  // 生成jwt token
  genToken(payload, key='i love u') {
    let token = jwt.sign( payload, key, { algorithm: 'RS256', expiresIn: 60*60*2 })   // 2小时 
    return token
  }
  // 注册
  async register(req, res, next) {
    let { username, password, authcode } = req.body
    if(authcode.toLowerCase() !== req.session.authcode) {
      res.send(failed({ data: '验证码错误'}))
      return
    }
    // 查找原数据库中是否存在 此用户名
    let userRes = await userModel.findOne({username})
    if(userRes) {
      res.send(failed({ data: '用户名已存在'}))
      return
    }
    let hash = await this._hashPassword(password)
    console.log(hash)
    let result = await userModel.save({
      username,
      password: hash
    })
    // console.log(result)
    if(result) {
      res.send(success({ data: '用户注册成功'}))
    } else {
      res.send(failed({ data: '用户注册失败'}))
    }
  }
  // 登陆
  async login(req, res, next) {
    // console.log(req.decoded, '----')
    let { username, password, authcode } = req.body
    if(authcode.toLowerCase() !== req.session.authcode) {
      res.send(failed({ data: '验证码错误'}))
      return
    }
    let result = await userModel.findOne({username})
    // console.log(result)
    // 没有找到数据
    if(!result) {
      res.send(failed({data: '此用户不存在'}))
      return
    }
    let compareRes = await this._comparePassword(password, result.password) 
    console.log(compareRes)
    // 密码没有比对成功
    if(!compareRes) {
      res.send(failed({data: '登陆密码错误'}))
      return
    }
    // 登陆成功
    //方案一：cookie-session存储  前端种下cookie 可查看  
    // req.session['username'] = result.username
    // console.log(req.cookies) 
    //种cookie res.cookie('key', '$MFWEGAQ')

    // 方案二： jwt
    //1.对称加密

    //2.非对称加密
    //生成 公钥私钥 mac:  先进入OpenSSL环境
    //然后 genrsa -out rsa_private_key.pem 2048 生成私钥
    //然后 pkcs8 -topk8 -inform PEM -in rsa_private_key.pem -outform PEM -nocrypt -out rsa_private_key_pkcs8.pem 转pkcs8
    //然后 rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem 生成公钥

    let privateKey = fs.readFileSync(path.resolve(__dirname, '../keygens/rsa_private_key.pem'))  //读取生成的私钥
    let token = this.genToken({username: result.username, _id: result._id}, privateKey)
    let updateRes = await userModel.updateOne({username: result.username, _id: result._id, token })
    if(updateRes.nModified === 1 && updateRes.n === 1) {
      res.header('X-Access-Token', token)
      res.send(success({data: {
        message: '登陆成功',
        token
      }}))
      return
    }
    res.send(failed({data: '登陆失败'}))
  }
  // 验证码
  svgCaptcha(req, res, next) {
    res.set('Content-Type', 'image/svg+xml')
    let captcha = svgCaptcha.create({
      inverse: false, // 翻转颜色 
      fontSize: 36, // 字体大小 
      noise: 2, // 噪声线条数 
      width: 80, // 宽度 
      height: 31, // 高度 
      size: 4,// 验证码长度
      // ignoreChars: '0o1i', // 验证码字符中排除 0o1i
    })
    req.session.authcode = captcha.text.toLowerCase()
    res.send(String(captcha.data))
  }
  // 获取用户信息
  async getUserInfo(req, res, next) {
     let { username, _id } = req.decoded
     let result = await userModel.findOne({username, _id})
     if(result) {
       res.send(success({
         data: {
           uid: result._id,
           username: result.username,
           head: result.head ? `/uploadHead/${result.head}` : ''
         }
       }))
       return
     }
     res.send(failed({
       data: '用户信息获取失败'
     }))
  }
  // 上传头像
  async uploadHead(req, res, next) {
    let { username, _id } = req.decoded
    let options = {
      autoFiles: true,
      uploadDir: 'public/uploadHead',
      maxFilesSize: 1024*1024
    }
    let form = new multiparty.Form(options)
    let headPath
    form.on('file', (name, file, ...rest) => {
      headPath = file.path
    })
    form.on('close', async () => {
      let pathArr
      if(/public\\uploadHead\\/.test(headPath)) {
        pathArr = headPath.split('\\')
      } else {
        pathArr = headPath.split('/')
      }
      let head = pathArr[pathArr.length - 1]
      let newHead = _id + '-img-' + head
      fs.renameSync(path.resolve(__dirname, `../public/uploadHead/${head}`), path.resolve(__dirname, `../public/uploadHead/${newHead}`))
      let result = await userModel.updateOne({username, _id, head: newHead, type: 'head'})
      let files = fs.readdirSync(path.resolve(__dirname, '../public/uploadHead'))
      // console.log(files, head)
      if(result.nModified === 1 && result.n === 1) {
        files.forEach((t) => {
          if(t !== newHead && t.indexOf(_id+"-img-") > -1) {
            fs.unlinkSync(path.resolve(__dirname, `../public/uploadHead/${t}`))
          }
        })
        res.send(success({data: '头像上传成功'}))
        return
      }
      fs.unlinkSync(path.resolve(__dirname, `../public/uploadHead/${newHead}`))
      res.send(failed({data: '头像上传失败'}))
    })
    form.on('error', (err) => {
      console.log(err.message)
      res.send(failed({data: '头像上传失败'}))
    })
    form.parse(req)
  }
  // 退出登陆
  async exit(req, res, next) {
    let { uid, username } = req.body
    let updateRes = await userModel.updateOne({username, _id: uid, token: 'null' })
    if(updateRes.nModified === 1 && updateRes.n === 1) {
      res.send(success({data:'已退出登陆'}))
      return
    }
    res.send(failed({data: '退出登陆失败'}))
  }
}

module.exports = new UsersController()