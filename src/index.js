
import keys from './keys';
let app
let _id = 0
const noop = () => {}
const map = new WeakMap();
const isProxySymbol = Symbol('isProxy')
const instSymbol = Symbol('__instSymbol__')
const idKey = instSymbol
let currentWatcher = null;
function destroyProxy(instance, proxyResult, path) {
  if (proxyResult) {
    const dependency = proxyResult.dependencies[instance[idKey]];
    if (path !== undefined) {
      const i = dependency.paths.indexOf(path)
      if (i !== -1) {
        dependency.paths.splice(i, 1)
      }
      if (!dependency.paths.length) {
        delete proxyResult.dependencies[instance[idKey]];
      }
    }
    if (!Object.keys(proxyResult.dependencies).length) {
      map.delete(proxyResult.proxy);
      map.delete(proxyResult.target);
    }
  } else {
    Object.keys(instance._proxyResults).forEach(path => {
      destroyProxy(instance, instance._proxyResults[path], path)
    })
  }
}
function getKey(path, key, isArray) {
  return isArray ? `${path}[${key}]` : (path ? `${path}.${key}` : key)
}
function firstKey(obj) {
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      return i;
    }
  }
}
function removeUndefined(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  })
}
function updatePromiseHandler(resolver) {
  this._updateQueue.push(resolver);
  if (!this._updatePending) {
    setTimeout(() => {
      this._updatePending = true;
      while (this._subscribersNeedRun.length) {
        const item = this._subscribersNeedRun.shift();
        item.run.call(this, (...args) => item.handler.call(this._proxy, ...args))
      }
      removeUndefined(this._updateMap)
      if (firstKey(this._updateMap)) {
        // console.info(`更新了vm ${this[idKey]}`, JSON.parse(JSON.stringify(this._updateMap)))
        this.setData(this._updateMap, () => {
          this._updateQueue.forEach((cb) => {
            cb()
          });
        })
        this._updateMap = {}
      }
      this._updatePending = false
    }, 13)
  }
}
function update() {
  return new Promise(updatePromiseHandler.bind(this))
}
function reflectSet({ target, proxy, subscribers, dependencies, isArray }, key, value) {
  let s = Reflect.set(target, key, value, proxy)
  if (s) {
    Object.values(dependencies).forEach(({paths, instance}) => {
      paths.forEach((path) => {
        instance._updateMap[getKey(path, key, isArray)] = value
        const watchers = subscribers[''].concat(subscribers[key] || [])
        if (watchers.length) {
          watchers.forEach(item => {
            if (instance._subscribersNeedRun.indexOf(item) === -1) {
              instance._subscribersNeedRun.push(item);
            }
          })
        }
        update.call(instance)
      })
    })
  }
  return s;
}

function innerProxy(target, path, deepSubscribers = []) {
  if (!path) path = ''
  const instance = this;
  let result = map.get(target)
  if (!result) {
    const isArray = Array.isArray(target);
    let subscribers = {
      '': deepSubscribers
    }
    const handler = {
      get(target, key, receiver) {
        if (key === isProxySymbol) {
          return true;
        }
        if (receiver === instance._proxy) {
          if (key === 'data') {
            return instance._proxy;
          }
          if (typeof instance[key] === 'function') {
            debugger;
            if (instance._methods[key]) {
              return instance._methods[key]
            }
            const fn = instance[key].bind(instance)
            Object.setPrototypeOf(fn, instance[key]);
            return fn;
          }
          if (key[0] === '$') {
            let s = instance[key.substr(1)];
            if (typeof s === 'function') {
              const fn = s.bind(instance);
              Object.setPrototypeOf(fn, s);
              return fn
            } else {
              return s;
            }
          }
        }
        let itemDeepSubscribers = subscribers['']
        if (currentWatcher) {
          if (target.hasOwnProperty(key)) {
            subscribers[key] = subscribers[key] || [];
            if (subscribers[key].indexOf(currentWatcher) === -1) {
              subscribers[key].push(currentWatcher);
            }
          }
          if (currentWatcher.deep) {
            itemDeepSubscribers = itemDeepSubscribers.concat(currentWatcher)
          }
        }
        let result = Reflect.get(target, key, receiver);
        if (typeof result === 'object' && result !== null) {
          try {
            result = innerProxy.call(instance, result, getKey(path, key, isArray), itemDeepSubscribers).proxy
          } catch(e) {}
        }
        return result;
      },
      set(target, key, value, receiver) {
        const oldValue = target[key];
        if (typeof oldValue === 'object' && target.hasOwnProperty(key) && oldValue !== null) {
          const proxyResult = map.get(value);
          if (proxyResult) {
            destroyProxy(instance, proxyResult, getKey(path, key, isArray));
          }
        }
        if (typeof value === 'object' && value[isProxySymbol]) {
          const proxyResult = map.get(value)
          value = proxyResult.target;
          addDependency(proxyResult, instance, getKey(path, key, isArray));
        }
        if (target[key] !== value && !(isArray && key === 'length')) {
          const s = reflectSet(result, key, value)
        }
        return true
      },
      deleteProperty(target, key) {
        const value = target[key];
        if (typeof value === 'object' && target.hasOwnProperty(key) && value !== null) {
          destroyProxy(instance, proxyResult, getKey(path, key, isArray));
        }
        const r = Reflect.deleteProperty(target, key)
        update.call(instance)
        return r
      }
    }
    result = { proxy: new Proxy(target, handler), target, subscribers, dependencies: {}, isArray }
    map.set(target, result)
    map.set(result.proxy, result);
  }
  addDependency(result, instance, path);
  return result
}

function addDependency(proxyResult, instance, path) {
  const dependency = proxyResult.dependencies[instance[idKey]] || {
    instance,
    paths: []
  };
  if (dependency.paths.indexOf(path) === -1) {
    dependency.paths.push(path);
  }
  proxyResult.dependencies[instance[idKey]] = dependency
  instance._proxyResults[path] = proxyResult
}

function proxy(methods, watchers) {
  this[instSymbol] = this[instSymbol] || _id++
  this._proxyResults = this._proxyResults || {};
  if (!this._proxy) {
    const sss = innerProxy.call(this, this.data);
    this._proxy = sss.proxy;
    this._subscribers = sss.subscribers;
  }
  this._subscribersNeedRun = this._subscribersNeedRun || [];
  this._updateMap = this._updateMap || {};
  this._updateQueue = this._updateQueue || [];
  this._methods = this._methods || {};
  Object.assign(this._methods, methods)
  watchers.forEach(item => {
    watch.call(this, item);
  })
}

function normalizeWatchOptions(args) {
  const options = {}
  if (typeof args[0] === 'function' || typeof args[0] === 'string') {
    options.watcher = args.shift()
  }
  if (typeof args[0] === 'function') {
    options.handler = args.shift()
  }
  Object.assign(options, args[0] || {})
  return options;
}
function watch(...args) {
  let item
  if (args.length === 1) {
    item = {...args[0]}
  } else {
    item = normalizeWatchOptions(args)
  }
  if (typeof item.watcher === 'string') {
    const key = item.watcher;
    item.watcher = function() {
      return this[key];
    }
  }
  item.run = item.run || function(callback) {
    const old = currentWatcher
    currentWatcher = item;
    const result = item.watcher.call(this._proxy);
    currentWatcher = old;
    const oldResult = item.result
    item.result = result;
    if (callback) callback.call(this._proxy, result, oldResult);
  }
  item.run.call(this, item.immediate ? item.handler : noop);
  item.instance = this;
  return () => {
    destroyWatch.call(this, item);
  }
}

function remove(arr, item) {
  let result = false;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      arr.splice(i, 1)
      result = true;
      break;
    }
  }
  return result;
}
function destroyWatch(item) {
  this._proxyResults.forEach((proxyResult) => {
    Object.values(proxyResult.subscribers).forEach((arr) => {
      remove(arr, item);
    })
    remove(proxyResult.subscribers[''], item)
  })
}

function proxyOptions(options) {
  const innerOptions = { methods: {}, properties: {} }
  const liftcycle = ['created', 'attached', 'ready', 'moved', 'detached']
  liftcycle.forEach(key => {
    if (options[key]) {
      innerOptions[key] = function(...args) {
        return options[key].call(this._proxy, ...args)
      }
    }
  })
  options.properties = Object.assign({}, options.props || {}, options.properties || {}) 
  Object.keys(options.properties).forEach(key => {
    const value = options.properties[key];
    innerOptions.properties[key] = value
    if (typeof value === 'object' && typeof value.observer === 'function') {
      innerOptions.properties[key] = {
        ...value,
        observer(...args) {
          return value.observer.call(this._proxy, ...args)
        }
      }
    }
  })
  if (options.methods) {
    Object.keys(options.methods).forEach((key) => {
      innerOptions.methods[key] = function(...args) {
        return options.methods[key].call(this._proxy, ...args)
      }
    });
  }
  ['data', 'relations', 'externalClasses', 'options', 'behaviors'].forEach((key) => {
    if (options[key]) {
      innerOptions[key] = options[key]
    }
  });
  const watchers = []
  if (options.watch) {
    Object.keys(options.watch).forEach((key) => {
      let item = options.watch[key];
      if (typeof item === 'object') {
        item = { watcher: key, ...item };
      } else {
        const handler = item;
        item = {
          watcher: key,
          handler
        }
      }
      watchers.push(item);
    })
  }
  if (options.computed) {
    Object.keys(options.computed).forEach((key) => {
      innerOptions.data[key] = null;
      watchers.push({
        watcher: options.computed[key],
        handler(val) {
          this[key] = val;
        },
        immediate: true
      })
    })
  }
  const oldCreated = innerOptions.created;
  innerOptions.created = function(...args) {
    proxy.call(this, options.methods, watchers);
    if (oldCreated) {
      return oldCreated.call(this, ...args)
    }
  }
  const oldDetached = innerOptions.detached;
  innerOptions.detached = function(...args) {
    const result = oldDetached ? oldDetached.call(this, ...args) : undefined;
    if (this._proxy) {
      destroyProxy(this)
      delete this._proxy
    }
  }
  return innerOptions
}

function ProxyComponent(options) {
  options = proxyOptions(options);
  options.methods.update = update
  options.methods.watch = watch;
  options.methods.updateModel = function(e) {
    const model = e.target.dataset.model
    if (model) {
      const { target, key } = keys.query(this._proxy, model);
      target[key] = e.detail.value;
    }
  }
  const oldCreated = options.created;
  options.behaviors = options.behaviors || []
  options.created = function(...args) {
    this.initOptions = options;
    this.app = app = app || getApp();
    if (oldCreated) {
      return oldCreated.call(this, ...args)
    }
  }
  return Component(options)
}
function ProxyBehavior(options) {
  return Behavior(proxyOptions(options))
}

export { ProxyComponent as Component, ProxyBehavior as Behavior  }
export default ProxyComponent;