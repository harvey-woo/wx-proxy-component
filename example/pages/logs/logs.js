//logs.js
const util = require('../../utils/util.js')
const wxProxy = require('../../utils/wx-proxy-component');
wxProxy.Component({
  data: {
    logs: []
  },
  onLoad: function () {
    this.logs = (wx.getStorageSync('logs') || []).map(log => {
      return util.formatTime(new Date(log))
    })
  }
})
