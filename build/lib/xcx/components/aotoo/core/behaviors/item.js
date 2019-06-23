const lib = require('../../lib')
import {
  commonBehavior,
  commonMethodBehavior
} from "./common";

export const itemBehavior = function(app, mytype) {
  mytype = mytype || 'item'
  return Behavior({
    behaviors: [commonBehavior(app, mytype), commonMethodBehavior(app, mytype)],
    properties: {
      item: {
        type: Object|String, 
        observer: function (params) { 
          if (!this.init) {
            if (params) {
              if (params.$$id) {
                this.setData({$item: lib.resetItem(params, this)})
              } else {
                this.update(params)
              }
            }
          }
        } 
      },
      id: String,
    },
    data: {
      $item: {}
    },
    lifetimes: {
      created: function() {
        this.$$is = 'item'
      },
      attached: function attached() { //节点树完成，可以用setData渲染节点，但无法操作节点
        const xitem = lib.resetItem(this.properties.item, this)
        if (xitem) {
          this.setData({
            "$item": xitem
          })
        }
      },
      ready: function () { //组件布局完成，这时可以获取节点信息，也可以操作节点
        const uniqId = this.uniqId
        const activePage = this.activePage = app.activePage
        const $id = this.data.item['$$id'] || this.properties.id || this.data.item['id']
        if ($id) {
          const itemKey = activePage['eles'][$id]
          if (itemKey) {
            activePage['elements'][itemKey] = this
          } else {
            activePage['elements'][$id] = this
          }
        }
        activePage.hooks.on('destory', function () {
          app['_vars'][uniqId] = null
          if ($id) {
            const itemKey = activePage['eles'][$id]
            activePage['elements'][$id] = null
            activePage['elements'][itemKey] = null
          }
        })
      }
    },
    methods: {
      attr: function (params) {
        return this.data.$item.attr
      },
      reset: function() {
        this.setData({$item: JSON.parse(this.originalDataSource)})
        return this
      },
      addClass: function(itCls) {
        itCls = lib.isString(itCls) ? itCls.split(' ') : undefined
        if (itCls) {
          let $item = this.data.$item
          let $itemClass = $item.itemClass && $item.itemClass.split(' ') || []
          itCls = itCls.filter(cls => $itemClass.indexOf(cls) == -1)
          $itemClass = $itemClass.concat(itCls)
          this.update({
            itemClass: $itemClass.join(' ')
          })
        }
      },

      hasClass: function (itCls) {
        itCls = lib.isString(itCls) ? itCls.split(' ') : undefined
        if (itCls) {
          let $item = this.data.$item
          let $itemClass = $item.itemClass && $item.itemClass.split(' ') || []
          itCls = itCls.filter(cls => $itemClass.indexOf(cls) !== -1)
          return itCls.length ? true : false
        }
      },

      removeClass: function(itCls) {
        itCls = lib.isString(itCls) ? itCls.split(' ') : undefined
        if (itCls) {
          let $item = this.data.$item
          let $itemClass = $item.itemClass && $item.itemClass.split(' ') || []
          let indexs = []
          $itemClass.forEach((cls, ii) => {
            if (itCls.indexOf(cls) !== -1) {
              indexs.push(ii)
            }
          })
          if (indexs.length) {
            indexs.forEach(index => $itemClass.splice(index, 1))
          }
          this.update({
            itemClass: $itemClass.join(' ')
          })
        }
      },

      update: function (param, callback) {
        const that = this
        const updateFun = (opts) => {
          let target = {}
          if (lib.isObject(opts)) {
            Object.keys(opts).forEach(key => {
              if (opts[key] || opts[key] === 0) {
                let nkey = key.indexOf('$item.') == -1 ? '$item.' + key : key
                target[nkey] = opts[key]
              }
            })
  
            that.setData(target)
            const _item = lib.resetItem(that.data.$item, that)
            that.setData({ $item: _item }, callback)
          }
        }

        let result = this.hooks.emit('update', param)
        if (result && result[0]) {
          result = result[0] 
          if (lib.isFunction(result.then)) {
            result.then( res => updateFun(res) ).catch(err => err)
          } else {
            updateFun(result)
          }
        } else {
          updateFun(param)
        }

        return this
      }
    }
  })
}

export const itemComponentBehavior = function(app, mytype) {
  return Behavior({
    behaviors: [itemBehavior(app, mytype)],
    definitionFilter(defFields, definitionFilterArr) {
      // 监管组件的setData
      defFields.methods = defFields.methods || {}
      defFields.methods._setData = function (data, opts, callback) {
        if (lib.isFunction(opts)) {
          callback = opts
          opts = {}
        }
        if (this.init) {
          if (data && lib.isObject(data)) {
            let myitem = data.$item || data.item || data.dataSource || {}
            data.$item = lib.resetItem(myitem, this)
          }
        }
        const originalSetData = this._originalSetData // 原始 setData
        originalSetData.call(this, data, callback) // 做 data 的 setData
      }
    },
    lifetimes: {
      created: function () {
        this._originalSetData = this.setData // 原始 setData
        this.setData = this._setData // 封装后的 setData
      },
      ready: function () { //组件布局完成，这时可以获取节点信息，也可以操作节点
        this.mount()
      },
    }
  })
}