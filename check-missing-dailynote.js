// ==UserScript==
// @name         查缺的日志
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  查出本月到今天为止缺的日志
// @author       kkopite
// @match        http://oa.smart-core.com.hk:7000/km/summary/index.jsp
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  // 1.修改显示条数为 40条
  // 2.填写年份，月份开始搜索
  // 3.获取所有显示的日志信息，抓取日期
  // 4.从本月第一天开始比对是否有对应的日志

  // 查询改日期对应的月份
  let curDate = new Date()

  // step 2 之后再调整每页数量，再次查询
  const step2 = () => {
    $('[data-lui-mark="paging.amount"]').val(40)
    document.querySelector('.lui_paging_btn').click()
  };

  // step 1 先使用日期查询
  const step1 = () => {
    const query = curDate.format('yyyy-MM')
    $('[data-lui-date-input-name]').val(query)
    $('.criteria-input-ok').click()
  }

  const sleep = (time) => new Promise((res) => {
    setTimeout(res, time)
  })

  /**
   * 
   * @param {Date} date 
   */
  const getDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31
    if ([4, 6, 9, 11].includes(month)) return 30

    if ((year % 400) === 0 ||
      (year % 4 === 0 && year % 100 !== 0)) return 29

    return 28
  }

  // step 3
  const step3 = () => {
    const arr = $('.lui_listview_rowtable_summary_box a.textEllipsis.com_subject > span > span')
    const reg = /.*?(\d{4}-\d{2}-\d{2}).*/
    const allDate = Array.prototype.map.call(arr, t => t.title.match(reg)[1])
    console.log(allDate)
    const temp = []
    const date = new Date()
    // 复制下
    date.setFullYear(curDate.getFullYear())
    date.setMonth(curDate.getMonth())
    date.setDate(curDate.getDate())

    // step 4 今天是几号
    const today = date.getDate()
    for (let i = 1; i <= today; i++) {
      date.setDate(i)
      const day = date.getDay()
      if (day === 0 || day === 6) continue; // 双休日直接跳过
      const query = date.format('yyyy-MM-dd')
      // 去allDate里面找有没有
      const idx = allDate.findIndex(val => val === query)
      if (idx === -1) {
        temp.push(query)
      }
    }

    alert('以下日期没有写日志：' + temp.join(','))
  }

  async function addDatePicker(onchange) {
    const lui = document.querySelector('.lui_list_operation')
    const btnWrapper = lui.lastElementChild

    const input = document.createElement('input')
    input.type = 'month'
    document.body.appendChild(input)
    input.value = curDate.format('yyyy-MM')
    input.addEventListener('change', e => {
      const date = new Date(e.target.value);
      date.setDate(getDays(date))
      onchange(date)
    })

    // 死循环、直到挂载
    while (true) {
      const tr = btnWrapper.querySelector('table tbody tr')
      if (tr) {
        tr.appendChild(input)
        break
      }
      await sleep(2000)
    }
  }


  async function addBtn(name, onClick) {
    const lui = document.querySelector('.lui_list_operation')
    const btnWrapper = lui.lastElementChild

    // 死循环、直到挂载
    while (true) {
      const tr = btnWrapper.querySelector('table tbody tr')
      if (tr) {

        const children = tr.children
        const btn = children[children.length - 1].cloneNode(true)

        btn.querySelector('[data-lui-type="lui/toolbar!Button"]').setAttribute('title', name)
        btn.querySelector('.lui-component.lui_widget_btn_txt').innerText = name

        btn.addEventListener('click', onClick)
        tr.appendChild(btn)

        break
      }

      await sleep(2000)
    }
  }

  function addCSS(css) {
    const style = document.createElement('style');
    style.innerText = css
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(style);
  }

  const css = `
.lui_list_operation {
width: auto;
}
`

  let btnContainer = null;

  function init() {
    btnContainer = document.createElement("div");
    btnContainer.style.position = "fixed";
    btnContainer.style.top = "124px";
    btnContainer.style.zIndex = 9999;
    btnContainer.style.right = 0;
    btnContainer.style.padding = "10px";
    document.body.append(btnContainer);

    addCSS(css)

    addBtn("查询缺的日期", async function () {
      step1()
      await sleep(3000)
      step2()
      await sleep(3000)
      step3()
    });

    addDatePicker((date) => {
      curDate = date
    })
  }

  init()

})();