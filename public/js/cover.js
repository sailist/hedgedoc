/* eslint-env browser, jquery */
/* global moment, serverurl */

import {
  checkIfAuth,
  clearLoginState,
  getLoginState,
  resetCheckAuth,
  setloginStateChangeEvent
} from './lib/common/login'

import {
  clearDuplicatedHistory,
  deleteServerHistory,
  getHistory,
  getStorageHistory,
  parseHistory,
  parseServerToHistory,
  parseStorageToHistory,
  postHistoryToServer,
  removeHistory,
  saveHistory,
  saveStorageHistoryToServer
} from './history'

import { saveAs } from 'file-saver'
import List from 'list.js'
import S from 'string'

require('./locale')

require('../css/cover.css')
require('../css/site.css')

require('./fix-aria-hidden-for-modals')

const options = {
  valueNames: ['id', 'title', 'timestamp', 'fromNow', 'time', 'tags', 'pinned',
    "cop",
    'file_id', 'parent_file_id', 'major_version', 'minor_version', 'patch_version'
  ],
  item: `<li class="col-xs-12 col-sm-6 col-md-6 col-lg-4">
          <span class="id" style="display:none;"></span>
          <a href="#">
            <div class="item">
              <div class="ui-history-pin fa fa-thumb-tack fa-fw"></div>
              <div class="ui-history-close fa fa-close fa-fw" data-toggle="modal" data-target=".delete-history-modal"></div>
              <div class="content">
                <h4 class="title"></h4>
                <p class="version">
                  <span class="major_version"></span>.
                  <span class="minor_version"></span>.
                  <span class="patch_version"></span>
                </p>
                <p>
                  <span class="file_id"></span> ·
                  <i><i class="fa fa-clock-o"></i> visited </i><i class="fromNow"></i>
                  <br>
                  <i class="timestamp" style="display:none;"></i>
                  <i class="time"></i>
                </p>
                <p class="tags"></p>
              </div>
            </div>
          </a>
        </li>`,
  page: 18,
  pagination: [{
    outerWindow: 1
  }]
}
const historyList = new List('history', options)

window.migrateHistoryFromTempCallback = pageInit
setloginStateChangeEvent(pageInit)

pageInit()

function pageInit () {
  checkIfAuth(
    data => {
      $('.ui-signin').hide()
      $('.ui-or').hide()
      $('.ui-welcome').show()
      if (data.photo) $('.ui-avatar').prop('src', data.photo).show()
      else $('.ui-avatar').prop('src', '').hide()
      $('.ui-name').html(data.name)
      $('.ui-signout').show()
      $('.ui-history').click()
      parseServerToHistory(historyList, parseHistoryCallback)
    },
    () => {
      $('.ui-signin').show()
      $('.ui-or').show()
      $('.ui-welcome').hide()
      $('.ui-avatar').prop('src', '').hide()
      $('.ui-name').html('')
      $('.ui-signout').hide()
      parseStorageToHistory(historyList, parseHistoryCallback)
    }
  )
}

$('.masthead-nav li').click(function () {
  $(this).siblings().removeClass('active')
  $(this).addClass('active')
})

// prevent empty link change hash
$('a[href="#"]').click(function (e) {
  e.preventDefault()
})

$('.ui-home').click(function (e) {
  if (!$('#home').is(':visible')) {
    $('.section:visible').hide()
    $('#home').fadeIn()
  }

  const $copTree = $("#cop-tree-container")
  
  // 修改请求路径
  fetch(`${serverurl}/c/info`)  // 改为与后端路由匹配的路径
    .then(response => response.json())
    .then(data => {
      const treeData = buildTreeData(data)
      renderTree($copTree, treeData)
    })
    .catch(err => {
      console.error('Failed to load cop tree:', err)
      $copTree.html('Failed to load cop tree')
    })
})

$('.ui-history').click(() => {
  if (!$('#history').is(':visible')) {
    $('.section:visible').hide()
    $('#history').fadeIn()
  }
})

function checkHistoryList () {
  if ($('#history-list').children().length > 0) {
    $('.pagination').show()
    $('.ui-nohistory').hide()
    $('.ui-import-from-browser').hide()
  } else if ($('#history-list').children().length === 0) {
    $('.pagination').hide()
    $('.ui-nohistory').slideDown()
    getStorageHistory(data => {
      if (data && data.length > 0 && getLoginState() && historyList.items.length === 0) {
        $('.ui-import-from-browser').slideDown()
      }
    })
  }
}

function parseHistoryCallback (list, notehistory) {
  checkHistoryList()
  // sort by pinned then timestamp
  list.sort('', {
    sortFunction (a, b) {
      const notea = a.values()
      const noteb = b.values()
      if (notea.pinned && !noteb.pinned) {
        return -1
      } else if (!notea.pinned && noteb.pinned) {
        return 1
      } else {
        if (notea.timestamp > noteb.timestamp) {
          return -1
        } else if (notea.timestamp < noteb.timestamp) {
          return 1
        } else {
          return 0
        }
      }
    }
  })
  // parse filter tags
  const filtertags = []
  for (let i = 0, l = list.items.length; i < l; i++) {
    const tags = list.items[i]._values.tags
    if (tags && tags.length > 0) {
      for (let j = 0; j < tags.length; j++) {
        // push info filtertags if not found
        let found = false
        if (filtertags.includes(tags[j])) { found = true }
        if (!found) { filtertags.push(tags[j]) }
      }
    }
  }
  buildTagsFilter(filtertags)
}

// update items whenever list updated
historyList.on('updated', e => {
  for (let i = 0, l = e.items.length; i < l; i++) {
    const item = e.items[i]
    if (item.visible()) {
      const itemEl = $(item.elm)
      const values = item._values
      const a = itemEl.find('a')
      const pin = itemEl.find('.ui-history-pin')
      const tagsEl = itemEl.find('.tags')
      // parse link to element a
      a.attr('href', `${serverurl}/${values.id}`)
      // parse pinned
      if (values.pinned) {
        pin.addClass('active')
      } else {
        pin.removeClass('active')
      }
      // parse tags
      const tags = values.tags
      if (tags && tags.length > 0 && tagsEl.children().length <= 0) {
        const labels = []
        for (let j = 0; j < tags.length; j++) {
          // push into the item label
          labels.push(`<span class='label label-default'>${tags[j]}</span>`)
        }
        tagsEl.html(labels.join(' '))
      }
    }
  }
  $('.ui-history-close').off('click')
  $('.ui-history-close').on('click', historyCloseClick)
  $('.ui-history-pin').off('click')
  $('.ui-history-pin').on('click', historyPinClick)
})

function historyCloseClick (e) {
  e.preventDefault()
  const id = $(this).closest('a').siblings('span').html()
  const value = historyList.get('id', id)[0]._values
  $('.ui-delete-history-modal-msg').text('Do you really want to delete below history?')
  $('.ui-delete-history-modal-item').html(`<i class="fa fa-file-text"></i> ${value.text}<br><i class="fa fa-clock-o"></i> ${value.time}`)
  clearHistory = false
  deleteId = id
}

function historyPinClick (e) {
  e.preventDefault()
  const $this = $(this)
  const id = $this.closest('a').siblings('span').html()
  const item = historyList.get('id', id)[0]
  const values = item._values
  let pinned = values.pinned
  if (!values.pinned) {
    pinned = true
    item._values.pinned = true
  } else {
    pinned = false
    item._values.pinned = false
  }
  checkIfAuth(() => {
    postHistoryToServer(id, {
      pinned
    }, (err, result) => {
      if (!err) {
        if (pinned) { $this.addClass('active') } else { $this.removeClass('active') }
      }
    })
  }, () => {
    getHistory(notehistory => {
      for (let i = 0; i < notehistory.length; i++) {
        if (notehistory[i].id === id) {
          notehistory[i].pinned = pinned
          break
        }
      }
      saveHistory(notehistory)
      if (pinned) { $this.addClass('active') } else { $this.removeClass('active') }
    })
  })
}

// auto update item fromNow every minutes
setInterval(updateItemFromNow, 60000)

function updateItemFromNow () {
  const items = $('.item').toArray()
  for (let i = 0; i < items.length; i++) {
    const item = $(items[i])
    const timestamp = parseInt(item.find('.timestamp').text())
    item.find('.fromNow').text(moment(timestamp).fromNow())
  }
}

let clearHistory = false
let deleteId = null

function deleteHistory () {
  checkIfAuth(() => {
    deleteServerHistory(deleteId, (err, result) => {
      if (!err) {
        if (clearHistory) {
          historyList.clear()
          checkHistoryList()
        } else {
          historyList.remove('id', deleteId)
          checkHistoryList()
        }
      }
      $('.delete-history-modal').modal('hide')
      deleteId = null
      clearHistory = false
    })
  }, () => {
    if (clearHistory) {
      saveHistory([])
      historyList.clear()
      checkHistoryList()
      deleteId = null
    } else {
      if (!deleteId) return
      getHistory(notehistory => {
        const newnotehistory = removeHistory(deleteId, notehistory)
        saveHistory(newnotehistory)
        historyList.remove('id', deleteId)
        checkHistoryList()
        deleteId = null
      })
    }
    $('.delete-history-modal').modal('hide')
    clearHistory = false
  })
}

$('.ui-delete-history-modal-confirm').click(() => {
  deleteHistory()
})

$('.ui-import-from-browser').click(() => {
  saveStorageHistoryToServer(() => {
    parseStorageToHistory(historyList, parseHistoryCallback)
  })
})

$('.ui-save-history').click(() => {
  getHistory(data => {
    const history = JSON.stringify(data)
    const blob = new Blob([history], {
      type: 'application/json;charset=utf-8'
    })
    saveAs(blob, `hedgedoc_history_${moment().format('YYYYMMDDHHmmss')}`, true)
  })
})

$('.ui-open-history').bind('change', e => {
  const files = e.target.files || e.dataTransfer.files
  const file = files[0]
  const reader = new FileReader()
  reader.onload = () => {
    const notehistory = JSON.parse(reader.result)
    // console.log(notehistory);
    if (!reader.result) return
    getHistory(data => {
      let mergedata = data.concat(notehistory)
      mergedata = clearDuplicatedHistory(mergedata)
      saveHistory(mergedata)
      parseHistory(historyList, parseHistoryCallback)
    })
    $('.ui-open-history').replaceWith($('.ui-open-history').val('').clone(true))
  }
  reader.readAsText(file)
})

$('.ui-clear-history').click(() => {
  $('.ui-delete-history-modal-msg').text('Do you really want to clear all history?')
  $('.ui-delete-history-modal-item').html('There is no turning back.')
  clearHistory = true
  deleteId = null
})

$('.ui-refresh-history').click(() => {
  const lastTags = $('.ui-use-tags').select2('val')
  $('.ui-use-tags').select2('val', '')
  historyList.filter()
  const lastKeyword = $('.search').val()
  $('.search').val('')
  historyList.search()
  $('#history-list').slideUp('fast')
  $('.pagination').hide()

  resetCheckAuth()
  historyList.clear()
  parseHistory(historyList, (list, notehistory) => {
    parseHistoryCallback(list, notehistory)
    $('.ui-use-tags').select2('val', lastTags)
    $('.ui-use-tags').trigger('change')
    historyList.search(lastKeyword)
    $('.search').val(lastKeyword)
    checkHistoryList()
    $('#history-list').slideDown('fast')
  })
})

$('.ui-delete-user-modal-cancel').click(() => {
  $('.ui-delete-user').parent().removeClass('active')
})

$('.ui-logout').click(() => {
  clearLoginState()
  location.href = `${serverurl}/logout`
})

let filtertags = []
$('.ui-use-tags').select2({
  placeholder: $('.ui-use-tags').attr('placeholder'),
  multiple: true,
  data () {
    return {
      results: filtertags
    }
  }
})
$('.select2-input').css('width', 'inherit')
buildTagsFilter([])

function buildTagsFilter (tags) {
  for (let i = 0; i < tags.length; i++) {
    tags[i] = {
      id: i,
      text: S(tags[i]).unescapeHTML().s
    }
  }
  filtertags = tags
}
$('.ui-use-tags').on('change', function () {
  const tags = []
  const data = $(this).select2('data')
  for (let i = 0; i < data.length; i++) { tags.push(data[i].text) }
  if (tags.length > 0) {
    historyList.filter(item => {
      const values = item.values()
      if (!values.tags) return false
      let found = false
      for (let i = 0; i < tags.length; i++) {
        if (values.tags.includes(tags[i])) {
          found = true
          break
        }
      }
      return found
    })
  } else {
    historyList.filter()
  }
  checkHistoryList()
})

$('.search').keyup(() => {
  checkHistoryList()
})

// focus user field after opening login modal
$('.signin-modal').on('shown.bs.modal', function () {
  const fieldLDAP = $('input[name=username]')
  const fieldEmail = $('input[name=email]')
  const fieldOpenID = $('input[name=openid_identifier]')
  if (fieldLDAP.length === 1) {
    fieldLDAP.focus()
  } else if (fieldEmail.length === 1) {
    fieldEmail.focus()
  } else if (fieldOpenID.length === 1) {
    fieldOpenID.focus()
  }
})

// 构建树形数据结构
function buildTreeData(flatData) {
  const allRoot = "FIL-C-131028-100002-EZX";
  const nodeMap = new Map()
  const duplicateCounter = new Map() // 用于追踪重复的 fileId
  
  // 创建根节点
  // nodeMap.set(allRoot, {
  //   id: allRoot,
  //   title: "Root",
  //   version: "v1.0.0",
  //   children: []
  // })
  flatData = flatData.filter(item => item.noteShortId)

  // 首先创建所有节点
  flatData.forEach(item => {
    const fileId = item.fileId
    if (nodeMap.has(fileId)) {
      // 处理重复的 fileId
      duplicateCounter.set(fileId, (duplicateCounter.get(fileId) || 1) + 1)
      const duplicateId = `${fileId}_${duplicateCounter.get(fileId)}`
      
      nodeMap.set(duplicateId, {
        fileId: duplicateId,
        title: `${item.title || `Untitled (${fileId})`} (duplicate ${duplicateCounter.get(fileId)})`,
        version: `v${item.majorVersion}.${item.minorVersion}.${item.patchVersion}`,
        noteId: item.noteId,
        noteShortId: item.noteShortId,
        noteAlias: item.noteAlias,
        children: []
      })
    } else {
      nodeMap.set(fileId, {
        fileId: fileId,
        title: item.title || `Untitled (${fileId})`,
        version: `v${item.majorVersion}.${item.minorVersion}.${item.patchVersion}`,
        noteId: item.noteId,
        noteShortId: item.noteShortId,
        noteAlias: item.noteAlias,
        children: []
      })
    }
  })

  // 建立父子关系
  flatData.forEach(item => {
    if (item.parentFileId === item.fileId) {
      return
    }
    const node = nodeMap.get(item.fileId)
    const parentNode = nodeMap.get(item.parentFileId)
    
    if (parentNode) {
      parentNode.children.push(node)
    } else {
      // 如果没有父节点，就连接到 allRoot
      nodeMap.get(allRoot).children.push(node)
    }
  })

  // 只返回根节点
  return [nodeMap.get(allRoot)]
}

// 渲染树结构
function renderTree($container, treeData) {
  $container.empty()
  const $tree = $('<ul class="cop-tree"></ul>')
  
  function renderNode(node) {
    const $li = $('<li></li>')
    const $content = $(`
      <div class="tree-node" data-shortid="${node.noteShortId}" data-alias="${node.noteAlias}">
        <a href="${serverurl}/${node.noteShortId || node.noteAlias}">
          <span class="node-title">${node.title}</span>
          <span class="note-file-id">${node.fileId}</span>
          <span class="node-version">${node.version}</span>
        </a>
      </div>
    `)
    
    $li.append($content)
    
    // 添加点击事件
    // $content.on('click', () => {
    //   window.location.href = `${serverurl}/${node.noteShortId || node.noteAlias}`
    // })

    if (node.children && node.children.length > 0) {
      const $childList = $('<ul></ul>')
      node.children.forEach(child => {
        $childList.append(renderNode(child))
      })
      $li.append($childList)
    }
    
    return $li
  }

  treeData.forEach(node => {
    $tree.append(renderNode(node))
  })
  
  $container.append($tree)
}
