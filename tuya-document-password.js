// ==UserScript==
// @name                涂鸦文档密码自动引入
// @namespace           http://tampermonkey.net/
// @version             0.0.3
// @description         英文简述
// @author              kkopite
// @match               https://wiki.tuyacn.com/share/doc/*
// @icon                https://www.google.com/s2/favicons?sz=64&domain=tuya.com
// @grant               none
// ==/UserScript==

// 1. 配置 文档代码-密码
// 2. 进入网页，进入获取代码、根据代码获取密码
// 3. 自动输入

(function () {
  'use strict'

  // 存储
  const password_key = '__PASSWORD__KEY__'
  class PasswordManager {
    constructor() {
      this.passwords = []
      this.init()
    }

    init() {
      const str = localStorage.getItem(password_key)
      try {
        this.passwords = JSON.parse(str) || []
      } catch (error) {

      }

      console.log('当前存储的密码');
      console.log(JSON.stringify(this.passwords, null, 2))
    }

    save(obj) {
      const index = this.passwords.findIndex(a => a.id === obj.id)
      if (index !== -1) {
        this.passwords[index] = obj
      } else {
        this.passwords.push(obj)
      }
      localStorage.setItem(password_key, JSON.stringify(this.passwords))
    }

    getPassword(id) {
      const index = this.passwords.findIndex(a => a.id === id)
      if (index !== -1) {
        return this.passwords[index].password
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

    getPasswordInput() {
      return document.querySelector('input')
    }

    fillPassword(password) {
      navigator.clipboard.writeText(password)



      const input = this.getPasswordInput()
      if (input) {
        // https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-change-or-input-event-in-react-js
        // react 改写了 input.value 的 set 方法
        // 因此需要调用这个 set 方法来改变 input 的 value值
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, password)

        input.dispatchEvent(new Event('change', {
          bubbles: true
        }))
      }

      // input.dispatchEvent(new Event('input', {
      //   bubbles: true
      // }))
    }

    getPassword() {
      return this.getPasswordInput().value || ''
    }
  }

  class Manager {
    constructor() {
      this.pm = new PasswordManager()
      this.ui = new UI()
      this.id = this.getId()

      this._saveCurrentPassword = this._saveCurrentPassword.bind(this)
      this._fillCurrentPassword = this._fillCurrentPassword.bind(this)
    }

    init() {
      this.pm.init()
      this.ui.init()

      this.ui.initBtn('保存', this._saveCurrentPassword)
      this.ui.initBtn('复制密码', this._fillCurrentPassword)

      const password = this.pm.getPassword(this.id)

      // 页面挂载后，马上给input填上密码，但过一会会自动又变为空，因此这里做个判断，如果密码不一样，就再重新填一次
      const observer = new MutationObserver((mutationsList, observer) => {
        console.log('mutationsList', mutationsList)
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'value') {
              console.log('fill password!', password, mutation.target.value, password !== mutation.target.value)
              if (password !== mutation.target.value) {
                this._fillCurrentPassword()
              }
            }
          }
        }
      })

      // 监听 value值
      observer.observe(document.querySelector('form input'), {
        attributes: true,
      })
    }

    _saveCurrentPassword() {
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

    _fillCurrentPassword() {
      const password = this.pm.getPassword(this.id)
      if (password) {
        this.ui.fillPassword(password)
      } else {
        console.log(`error: ${this.id} 没有对应的密码`);
      }
    }
  }

  const manager = new Manager()
  manager.init()

  manager._fillCurrentPassword()
})()