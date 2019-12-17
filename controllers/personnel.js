const personnelModel = require('../models/personnel')
const { success, failed } = require('../utils/send')
const uuid = require('uuid')
const multiparty = require('multiparty')
const xlsx = require('node-xlsx')
const path = require('path')
const fs = require('fs')

class PersonnelController {
  constructor() {
    
  }
  getID() {
    return uuid.v1()
  }
  // 获取列表
  async perlist(req, res, next) {
    let { _id, username } = req.decoded
    let { page, pagenum, keywords } = req.query
    // console.log(req.decoded, new Date().getTime())
    let result_all = await personnelModel.findAll({uid: _id, username, keywords})
    // console.log(result_all.length)
    if(result_all.length < 1) {
      res.send(success({data: {
        personnelList: [],
        total: 0
      }}))
      return
    }
    let result_many = await personnelModel.findMany({uid:_id, username, page: parseInt(page), pagenum: parseInt(pagenum), keywords})
    // console.log(result_many)
    res.send(success({data: {
      personnelList: result_many || [],
      total: result_all.length
    }}))
  }
  // 添加成员
  async addPersonnel(req, res, next) {
    let { _id, username } = req.decoded
    let { name, age, phone } = req.body

    let result = await personnelModel.save({ uid: _id, username, name, age, phone })
    // console.log(result)
    if(result) {
      res.send(success({data: '添加成功'}))
      return
    }
    res.send(failed({data: '添加失败'}))
  }
  // 删除成员
  async deletePersonnel(req, res, next) {
    let { _id } = req.body
    // console.log(_id)
    let result = await personnelModel.deleteOne({_id})
    if(result.deletedCount === 1) {
      res.send(success({data: '删除成功'}))
      return
    }
    res.send(failed({data: '删除失败'}))
  }
  // excel上传
  async upfilePersonnel(req, res, next) {
    let { _id, username } = req.decoded
    let options = {
      autoFiles: true,
      uploadDir: 'public/dir-excel',
      maxFilesSize: 1024*1024  //1024 = 1kb  当最大1M
    }
    let form = new multiparty.Form(options)
    let excelPath

    form.on('file', (name, file, ...rest) => { // 接收到文件参数时，触发file事件
      excelPath = file.path
    })

    form.on("close", async () => {
      console.log("upload complete")
      let xlsxObj = xlsx.parse(path.resolve(__dirname, `../${excelPath}`))
      let xlsxArr = xlsxObj[0].data
      let iscir = true
      let saveDataArr = []
      xlsxArr.forEach((item, index) => {
        if(index === 0 || item.length < 1) return
        let saveObj = {
          uid: _id,
          username
        }
        item.forEach((t, i) => {
          if(i === 0) saveObj['name'] = t
          if(i === 1) saveObj['age'] = t
          if(i === 2) saveObj['phone'] = t
        })
        saveDataArr.push(saveObj)
      })
      // 拿到数据后 excel删除掉  没用了
      fs.unlinkSync(path.resolve(__dirname, `../${excelPath}`))
      // 批量插入
      let result = await personnelModel.saveMany(saveDataArr)
      if(result) {
        res.send(success({data: 'excel上传成功'}))
        return
      }   
      res.send(failed({data: 'excel上传失败'}))
    })

    form.on("error", (err) => {
      console.log(err.message)
      res.send(failed({data: 'excel上传失败'}))
    })
    form.parse(req)
  }
  // 编辑修改
  async updatePersonnel(req, res, next) {
    let { _id, name, age, phone } = req.body
    let result = await personnelModel.updateOne({ _id, name, age, phone })
    // console.log(result)
    if(result.nModified === 1 && result.n === 1) {
      res.send(success({data: '编辑成功'}))
      return
    }
    res.send(failed({data: '编辑失败'}))
  }
  // 批量删除
  async deleteBatchPersonnel(req, res, next) {
    let { idList } = req.body
    let result = await personnelModel.deleteMany({idList})
    if(result.deletedCount === idList.length) {
      res.send(success({data: '批量删除成功'}))
      return
    }
    res.send(failed({data: `批量删除异常，已删除${result.deletedCount}条数据`}))
  }
}

module.exports = new PersonnelController()