const db = require('../utils/db')

class PersonnelModel {
  constructor() {
    //初始化 模型
    this.personnel_model = db.model('personnels', {
      uid: String,
      username: String,
      name: String,
      age: String,
      phone: String
    })
  }
  // 插入
  save(data) {
    // 实例化model 同时插入数据
    const personnel = new this.personnel_model(data)
    // 执行插入数据
    return personnel.save()
  }
  // 批量插入
  saveMany(data) {
    return this.personnel_model.insertMany(data)
  }
  // 分页查询
  findMany(data) {
    let regExp = new RegExp(data.keywords, 'i')
    return this.personnel_model.find({
      $and: [
        {uid: data.uid, username: data.username},
        {
          $or: [
            {name: regExp},
            {phone: regExp}
          ]
        }
      ]
    }, {name: true, _id: true, age: true, phone: true}).skip((data.page - 1) * data.pagenum).limit(data.pagenum)
  }
  // 全部查询
  findAll(data) {
    let regExp = new RegExp(data.keywords, 'i')
    return this.personnel_model.find({
      $and: [
        {uid: data.uid, username: data.username},
        {
          $or: [
            {name: regExp},
            {phone:regExp}
          ]
        }
      ]
    })
  }
  // 删除
  deleteOne(data) {
    return this.personnel_model.deleteOne(data)
  }
  // 批量删除
  deleteMany(data) {
    return this.personnel_model.remove({_id: { $in: data.idList }})
  }
  updateOne(data) {
    return this.personnel_model.updateOne({_id: data._id}, {$set: {name: data.name, age: data.age, phone: data.phone}})
  }
}


module.exports = new PersonnelModel()