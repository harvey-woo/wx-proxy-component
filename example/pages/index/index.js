//index.js
//获取应用实例
const wxProxy = require('../../utils/wx-proxy-component');
wxProxy.Component({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  methods: {
    //事件处理函数
    bindViewTap: function () {
      wx.navigateTo({
        url: '../logs/logs'
      })
    },
    onLoad: function () {
      const app = this.$app;
      if (app.globalData.userInfo) {
        this.userInfo = app.globalData.userInfo;
        this.hasUserInfo = true;
      } else if (this.data.canIUse) {
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        app.userInfoReadyCallback = res => {
          this.userInfo = res.userInfo;
          this.hasUserInfo = true;
        }
      } else {
        // 在没有 open-type=getUserInfo 版本的兼容处理
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo
            this.userInfo = res.userInfo;
            this.hasUserInfo = true;
          }
        })
      }
    },
    getUserInfo: function (e) {
      const app = this.$app
      app.globalData.userInfo = e.detail.userInfo
      this.userInfo = e.detail.userInfo;
      this.hasUserInfo = true;
    }
  }

})
