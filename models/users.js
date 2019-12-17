const db = require('../utils/db')

class UserModel {
  constructor() {
    //初始化 模型
    this.user_model = db.model('users', {
      username: String,
      password: String,
      head: String,
      token: String
    })
  }
  // 插入
  save(data) {
    // 实例化model 同时插入数据
    const users = new this.user_model(data)
    // 执行插入数据
    return users.save()
  }
  // 查询
  findOne(data) {
    return this.user_model.findOne(data)
  }
  // 修改写入头像图片名称
  updateOne(data) {
    if(data.type === 'head') {
      return this.user_model.updateOne({_id: data._id, username: data.username}, {$set: {head: data.head}})
    }
    return this.user_model.updateOne({_id: data._id, username: data.username}, {$set: {token: data.token}})
  }
}


module.exports = new UserModel()