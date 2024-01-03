// ==UserScript==
// @name                涂鸦文档密码自动引入
// @namespace           http://tampermonkey.net/
// @version             0.0.1
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
      const index = this.passwords.findIndex(a => a.id === id)
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


      // FIXME: 不知道如何触发事件，源码里面如何处理事件监听
      // ant-design的input使用 rc-input
      // 该项目使用 监听 onPressEnter 事件来修改数据
      // 因此 这里模拟 点击回车事件
      // https://github.com/react-component/input/blob/e643b06174fe363d95f312d5ae8b41016df3bc38/src/Input.tsx#L154
      // const e = new Event('keydown', {
      //   bubbles: false
      // })
      // e.key = 'Enter'
      // e.code = 'Enter'
      // e.keyCode = 13
      // input.dispatchEvent(e)

      // input.dispatchEvent(new Event('input', {
      //   bubbles: true
      // }))
      // input.dispatchEvent(new Event('change', {
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
        console.log(`error: ${id} 没有对应的密码`);
      }
    }
  }

  const manager = new Manager()
  manager.init()

  manager._fillCurrentPassword()

})()