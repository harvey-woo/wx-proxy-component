### 这个项目在测试阶段，请勿用于生产环境，欢迎测试，并提交issus

#这个是什么
这是一个微信小程序替代原生Component的数据层代理构造器，它基于Proxy，实现了可以通过注册的方法以及生命钩子等函数来直接写入成员变量以及自动更新视图的功能，并且提供了类似vue的watch和computed api，让各位在开发小程序的时候更顺畅

#安装
- 基于webpack以及一些构建环境
```javascript
  import Conponent from 'proxy-component'
```
- 基于小程序web开发工具原有构建，直接下载 **dist/wx-proxy-component.js** 复制项目后，通过 `require` 进行引用 

#使用
大部分api与原生的Component一致，请参考微信小程序的开发文档，此文档只提供不一样的部分
## 基本用法
```javascript
import Component from 'proxy-component'
Component({
  // 初始化的数据
  data: {},
  // 生命钩子
  created() {},
  attached() {},
  // 方法
  methods: {
    method1() {},
    method2() {}
  }
})
```

## `this` 的引用
在所有生命钩子以及方法里边的this，都会被指向到代理对象，代理对象可以直接设置成员变量
```html
<button>{{btnName}}</button>
```
```javascript
Component({
  data: {
    btnName: '加载中...'
  },
  attached() {
    this.btnName = '点我!!'
  },
  methods: {
    onTap() {
      this.btnName = '别点我!!'
      // 不需要setData
    }
  }
})
```

