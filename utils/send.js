const send = {
  success({code=200, data}) {
    return {
      code,
      data, 
      success: true
    }
  },
  failed({code=400, data}) {
    return {
      code,
      data,
      success: false
    }
  }
}

module.exports = send