// ==UserScript==
// @name                自动填写简称
// @namespace           http://tampermonkey.net/
// @version             0.0.5
// @description         英文简述
// @author              kkopite
// @match               https://smartdo-cn.tuya-inc.com:7799/user/login
// @icon                https://www.google.com/s2/favicons?sz=64&domain=tuya.com
// @grant               none
// ==/UserScript==

// 1. 配置 文档代码-密码
// 2. 进入网页，进入获取代码、根据代码获取密码
// 3. 自动输入

(function () {
  'use strict'

  // 存储
  const FORM_KEY = '__FORM__KEY__'
  class FormManager {
    constructor() {
      this.obj = {}
      this.init()
    }

    init() {
      const str = localStorage.getItem(FORM_KEY)
      try {
        this.obj = JSON.parse(str) || {}
      } catch (error) {

      }

      console.log('当前存储的表单信息');
      console.log(JSON.stringify(this.obj, null, 2))
    }
    
    merge(newObj) {
      if (typeof newObj !== 'object' || newObj === null) {
        console.warn('传入的密码不是对象', newObj)
        return
      }

      this.obj = {
        ...this.obj,
        ...newObj
      }
      localStorage.setItem(FORM_KEY, JSON.stringify(this.obj))
    }

    save(key, value) {
      this.obj[key] = value
      localStorage.setItem(FORM_KEY, JSON.stringify(this.obj))
    }

    getFormData() {
      return {
        ...this.obj
      }
    }
  }

  class UI {
    init() {
      this.container = document.createElement('div')
      this.container.style.position = 'fixed'
      this.container.style.top = '24px'
      this.container.style.right = '24px'
      document.body.appendChild(this.container)
    }

    initBtn(name, onClick) {
      const btn = document.createElement('button')
      btn.innerText = name
      btn.addEventListener('click', onClick)
      this.container.appendChild(btn)
    }

    addInput(name, onChange) {
      const btn = document.createElement('button')
      const id = Math.random().toString(36).slice(2)
      const label = document.createElement('label')
      label.htmlFor = id
      label.innerText = name
      const input = document.createElement('input')
      input.id = id
      input.type = 'file'
      input.addEventListener('change', onChange)
      input.style.display = 'none'
      btn.appendChild(label)
      btn.appendChild(input)
      this.container.appendChild(btn)
    }

    fillFormInput(input, value) {
      if (input) {
        // https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-change-or-input-event-in-react-js
        // react 改写了 input.value 的 set 方法
        // 因此需要调用这个 set 方法来改变 input 的 value值
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, value)

        input.dispatchEvent(new Event('change', {
          bubbles: true
        }))
      }
    }

    getAllInputs() {
      const ids = [
        'tenantShortName'
      ]

      return ids.map(id => ({
        id,
        input: document.getElementById(id)
      }))
    }
  }

  class Manager {
    constructor() {
      this.fm = new FormManager()
      this.ui = new UI()

      this._saveFormData = this._saveFormData.bind(this)
      this._fillFormData = this._fillFormData.bind(this)
      this._exportJSON = this._exportJSON.bind(this)
    }

    init() {
      this.fm.init()
      this.ui.init()

      this.ui.initBtn('保存当前表单', this._saveFormData)
      this.ui.initBtn('复制已存的表单', this._fillFormData)
      this.ui.initBtn('导出JSON', this._exportJSON)
      this.ui.addInput('导入JSON', (e) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (e) => {
          const str = e.target.result
          this.fm.merge(JSON.parse(str))
        }
        reader.readAsText(file)
      })

      const formData = this.fm.getFormData()

      // 页面挂载后，马上给input填上密码，但过一会会自动又变为空，因此这里做个判断，如果密码不一样，就再重新填一次
      const observer = new MutationObserver((mutationsList, observer) => {
        console.log('mutationsList', mutationsList)
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'value') {
              const id = mutation.target.id
              const value = formData[id]
              console.log(`fill ${id}!`, value, mutation.target.value, value !== mutation.target.value)
              if (value !== mutation.target.value) {
                this.ui.fillFormInput(mutation.target, value)
              }
            }
          }
        }
      })

      // 监听 value值
      const inputs = this.ui.getAllInputs()

      inputs.forEach(({ input }) => {
        observer.observe(input, {
          attributes: true,
        })
      })
    }

    _exportJSON() {
      const str = localStorage.getItem(FORM_KEY)
      const blob = new Blob([str], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'password.json'
      a.click()
    }

    _saveFormData() {
      const password = this.ui.getPassword()
      if (!password) {
        alert('当前没有输入密码')
        return
      }

      this.pm.save({
        password,
        id: this.id
      })
    }

    getId() {
      return window.location.pathname.split('/').pop()
    }

    _fillFormData() {
      const allInputs = this.ui.getAllInputs()
      const obj = this.fm.getFormData()
      allInputs.forEach(({ id, input }) => {
        const value = obj[id]
        if (value) {
          this.ui.fillFormInput(input, value)
        } else {
          console.log(`error: ${id} 没有对应的填充`);
        }
      })
    }
  }

  const manager = new Manager()
  manager.init()

  manager._fillFormData()
})();