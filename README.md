### 这个项目在测试阶段，请勿用于生产环境，欢迎测试，并提交issus

## 这个是什么
这是一个微信小程序替代原生Component的数据层代理构造器，它基于Proxy，实现了可以通过注册的方法以及生命钩子等函数来直接写入成员变量以及自动更新视图的功能，并且提供了类似vue的watch和computed api，让各位在开发小程序的时候更顺畅

## 安装
- 基于webpack以及一些构建环境
```javascript
  import Component from 'wx-proxy-component'
  Component({
    //...
  })
```
- 基于小程序web开发工具原有构建，直接下载 **dist/wx-proxy-component.js** 复制到项目后，通过 `require` 进行引用 
```javascript
  const wxProxy = require('../../utils/wx-proxy-component');
  wxProxy.Component({
    //...
  })
````

## 使用
大部分api与原生的Component一致，请参考微信小程序的开发文档，此文档只提供不一样的部分
### 基本用法
```json
// 如果是页面组件，需要加上usingComponent
{
  "usingComponents": {}
}
```
```javascript
import Component from 'wx-proxy-component'
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

### `this` 的引用
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
注意的是，属性是可以深度赋值的，只要是proxy-component的实例，都会触发更新，这意味着，你只需要像一般的处理数据的方式处理实例，实例就会将数据周期性更新到视图上

### watch
proxy-component 提供了watch和$watch函数，你可以使用它来监听数据的变动，并作出相应的行为
```javascript
Component({
  data: { foo: 1 },
  watch: {
    foo(v, oV) {
      console.log(`foo 从 ${oV} 变成了 ${v}`)
    }
  },
  methods: {
    onTap() {
      this.foo = 2
    }
  }
})
```
具体api，请参照vue的watch

### computed
proxy-component 还提供了computed，用于对数据变化来映射到具体的成员变化
```javascript
Component({
  data: {
    foo: 'foo',
    bar: 'bar'
  }
  computed: {
    foobar() {
      return `${this.foo} ${this.bar}` 
    }
  }
})
```
具体api，仍然是参考vue
