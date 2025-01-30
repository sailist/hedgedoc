/* eslint-env browser, jquery */
/* global _ */
// Inject line numbers for sync scroll.

import markdownitContainer from 'markdown-it-container'
import { render_heading_open } from '../md_plugins/cop_md/title'

import { md } from '../extra'
import modeType from './modeType'
import appState from './appState'

function addPart (tokens, idx) {
  if (tokens[idx].map && tokens[idx].level === 0) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    tokens[idx].attrJoin('class', 'part')
    tokens[idx].attrJoin('data-startline', startline)
    tokens[idx].attrJoin('data-endline', endline)
  }
}

md.renderer.rules.blockquote_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('class', 'raw')
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.bullet_list_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}



md.renderer.rules.list_item_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('class', 'raw')
  if (tokens[idx].map) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    tokens[idx].attrJoin('data-startline', startline)
    tokens[idx].attrJoin('data-endline', endline)
  }
  return self.renderToken(...arguments)
}
md.renderer.rules.ordered_list_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.paragraph_open = function (tokens, idx, options, env, self) {
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('class', 'raw')
  addPart(tokens, idx)
  return render_heading_open(tokens, idx, options, env, self)
}
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
  let langName = ''
  let highlighted

  if (info) {
    langName = info.split(/\s+/g)[0]
    if (/!$/.test(info)) token.attrJoin('class', 'wrap')
    token.attrJoin('class', options.langPrefix + langName.replace(/=$|=\d+$|=\+$|!$|=!/, ''))
    token.attrJoin('class', 'hljs')
    token.attrJoin('class', 'raw')
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || md.utils.escapeHtml(token.content)
  } else {
    highlighted = md.utils.escapeHtml(token.content)
  }

  if (highlighted.indexOf('<pre') === 0) {
    return `${highlighted}\n`
  }

  if (tokens[idx].map && tokens[idx].level === 0) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    return `<pre class="part" data-startline="${startline}" data-endline="${endline}"><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`
  }

  return `<pre><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`
}
md.renderer.rules.code_block = (tokens, idx, options, env, self) => {
  if (tokens[idx].map && tokens[idx].level === 0) {
    const startline = tokens[idx].map[0] + 1
    const endline = tokens[idx].map[1]
    return `<pre class="part" data-startline="${startline}" data-endline="${endline}"><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>\n`
  }
  return `<pre><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>\n`
}
function renderContainer (tokens, idx, options, env, self) {
  tokens[idx].attrJoin('role', 'alert')
  tokens[idx].attrJoin('class', 'alert')
  tokens[idx].attrJoin('class', `alert-${tokens[idx].info.trim()}`)
  addPart(tokens, idx)
  return self.renderToken(...arguments)
}

md.use(markdownitContainer, 'success', { render: renderContainer })
md.use(markdownitContainer, 'info', { render: renderContainer })
md.use(markdownitContainer, 'warning', { render: renderContainer })
md.use(markdownitContainer, 'danger', { render: renderContainer })

window.preventSyncScrollToEdit = false
window.preventSyncScrollToView = false

const editScrollThrottle = 5
const viewScrollThrottle = 5
const buildMapThrottle = 100

let viewScrolling = false
let editScrolling = false

let editArea = null
let viewArea = null
let markdownArea = null

let editor

let firstOnScroll = false

export function setupSyncAreas (edit, view, markdown, _editor) {
  editArea = edit
  viewArea = view
  markdownArea = markdown
  editor = _editor

  editArea.on('scroll', _.throttle(syncScrollToView, editScrollThrottle))
  viewArea.on('scroll', _.throttle(syncScrollToEdit, viewScrollThrottle))
}

let realLineToViewYMap, absLineNoToWrapLineNoMap, viewTop, viewBottom

export function clearMap () {
  realLineToViewYMap = null
  absLineNoToWrapLineNoMap = null
  viewTop = null
  viewBottom = null
}
window.viewAjaxCallback = clearMap

const buildMap = _.throttle(buildMapInner, buildMapThrottle)

// Build offsets for each line (lines can be wrapped)
// That's a bit dirty to process each line everytime, but ok for demo.
// Optimizations are required only for big texts.
function buildMapInner (callback) {
  if (!viewArea || !markdownArea) return
  let i, pos, a, b, acc

  const offset = viewArea.scrollTop() - viewArea.offset().top
  const _scrollMap = []
  const nonEmptyList = []
  const _lineHeightMap = []
  viewTop = 0
  viewBottom = viewArea[0].scrollHeight - viewArea.height()

  acc = 0
  const lines = editor.getValue().split('\n')
  const lineHeight = editor.defaultTextHeight()
  for (i = 0; i < lines.length; i++) {
    acc = editor.heightAtLine(i + 1) - editor.heightAtLine(0)
    _lineHeightMap.push(acc / lineHeight)
  }
  
  _lineHeightMap.push(acc)
  const linesCount = acc
  for (i = 0; i < linesCount; i++) {
    _scrollMap.push(-1)
  }

  nonEmptyList.push(0)
  // make the first line go top
  _scrollMap[0] = viewTop

  const parts = markdownArea.find('[data-startline]').toArray()
  for (i = 0; i < parts.length; i++) {
    const $el = $(parts[i])
    let t = $el.attr('data-startline') - 1
    if (t === '') {
      return
    }
    if (t !== 0 && t !== nonEmptyList[nonEmptyList.length - 1]) {
      nonEmptyList.push(t)
    }
    _scrollMap[t] = Math.round($el.offset().top + offset - 10)
  }

  nonEmptyList.push(linesCount)
  _scrollMap[linesCount] = viewArea[0].scrollHeight

  pos = 0
  for (i = 1; i < linesCount; i++) {
    if (_scrollMap[i] !== -1) {
      pos++
      continue
    }

    a = nonEmptyList[pos]
    b = nonEmptyList[pos + 1]
    _scrollMap[i] = Math.round((_scrollMap[b] * (i - a) + _scrollMap[a] * (b - i)) / (b - a))
  }

  _scrollMap[0] = 0


  realLineToViewYMap = _scrollMap
  // editor line to real wrapped line
  absLineNoToWrapLineNoMap = _lineHeightMap
  console.log(_scrollMap)

  if (window.loaded && callback) callback()
}

// sync view scroll progress to edit
let viewScrollingTimer = null

export function syncScrollToEdit (event, preventAnimate) {
  if (appState.currentMode !== modeType.both || !appState.syncscroll || !editArea) return
  if (window.preventSyncScrollToEdit) {
    if (typeof window.preventSyncScrollToEdit === 'number') {
      window.preventSyncScrollToEdit--
    } else {
      window.preventSyncScrollToEdit = false
    }
    return
  }
  if (!realLineToViewYMap || !absLineNoToWrapLineNoMap) {
    buildMap(() => {
      syncScrollToEdit(event, preventAnimate)
    })
    return
  }
  if (editScrolling) return

  const scrollTop = viewArea[0].scrollTop
  let editorLineNo = 0
  for (let i = 0, l = realLineToViewYMap.length; i < l; i++) {
    if (realLineToViewYMap[i] > scrollTop) {
      break
    } else {
      editorLineNo = i
    }
  }
 
  

  let editorLinePos = editor.heightAtLine(editorLineNo) - editor.heightAtLine(0)
  const scrollInfo = editor.getScrollInfo()

  let duration = 0
  if (preventAnimate) {
    editArea.scrollTop(editorLinePos)
  } else {
    const posDiff = Math.abs(scrollInfo.top - editorLinePos)
    duration = posDiff / 50
    duration = duration >= 100 ? duration : 100
    editArea.stop(true, true).animate({
      scrollTop: editorLinePos
    }, duration, 'linear')
  }

  viewScrolling = true
  clearTimeout(viewScrollingTimer)
  viewScrollingTimer = setTimeout(viewScrollingTimeoutInner, duration * 1.5)
}

function viewScrollingTimeoutInner () {
  viewScrolling = false
}

// sync edit scroll progress to view
let editScrollingTimer = null

function findAbsLineNoByHeight(scrollTop) {
  let left = 0
  let right = editor.lineCount() - 1
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const height = editor.heightAtLine(mid) - editor.heightAtLine(0)
    
    if (Math.abs(height - scrollTop) < 5) { // 允许5px的误差
      return mid
    }
    
    if (height < scrollTop) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  
  // 返回最接近的行号
  const leftHeight = editor.heightAtLine(left) - editor.heightAtLine(0)
  const rightHeight = editor.heightAtLine(right) - editor.heightAtLine(0)
  
  return Math.abs(leftHeight - scrollTop) < Math.abs(rightHeight - scrollTop) ? left : right
}

export function syncScrollToView (event, preventAnimate) {
  if (appState.currentMode !== modeType.both || !appState.syncscroll || !viewArea) return
  if (window.preventSyncScrollToView) {
    if (typeof preventSyncScrollToView === 'number') {
      window.preventSyncScrollToView--
    } else {
      window.preventSyncScrollToView = false
    }
    return
  }
  if (!realLineToViewYMap || !absLineNoToWrapLineNoMap) {
    buildMap(() => {
      syncScrollToView(event, preventAnimate)
    })
    return
  }

  if (!firstOnScroll && event && event.type === 'scroll') {
    firstOnScroll = true
    buildMap(() => {
      syncScrollToView(event, preventAnimate)
    })
    return
  }
  if (viewScrolling) return

  const scrollInfo = editor.getScrollInfo()
  const absLineNo = findAbsLineNoByHeight(scrollInfo.top)
  
  // 继续使用 absLineNo 查找对应的元素
  const elements = markdownArea.find('.part').toArray()
  const result = findClosestElement(elements, absLineNo)
  const $el = result.element
  
  // 计算目标滚动位置
  const elTop = $el.offset().top + viewArea.scrollTop() - viewArea.offset().top
  const elHeight = $el.height()
  const posTo = Math.round(elTop + (elHeight * result.progress))

  // 执行滚动
  let duration = 0
  if (preventAnimate) {
    viewArea.scrollTop(posTo)
  } else {
    const posDiff = Math.abs(viewArea.scrollTop() - posTo)
    duration = posDiff / 50
    duration = duration >= 100 ? duration : 100
    viewArea.stop(true, true).animate({
      scrollTop: posTo
    }, duration, 'linear')
  }

  editScrolling = true
  clearTimeout(editScrollingTimer)
  editScrollingTimer = setTimeout(editScrollingTimeoutInner, duration * 1.5)
}

// 二分查找最接近的元素
function findClosestElement(elements, targetLine) {
  let left = 0
  let right = elements.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const $el = $(elements[mid])
    const startLine = parseInt($el.attr('data-startline'))
    const endLine = parseInt($el.attr('data-endline'))

    if (targetLine >= startLine && targetLine <= endLine) {
      const childElements = $el.find('[data-startline]').toArray()
      if (childElements.length > 0) {
        const childResult = findClosestElement(childElements, targetLine)
        if (!childResult.element.length) {
          return { element: $el, progress: (targetLine - startLine) / (endLine - startLine) }
        }
        return childResult
      }
      
      if (startLine === endLine) {
        return { element: $el, progress: 0 }
      }
      return { element: $el, progress: (targetLine - startLine) / (endLine - startLine) }
    }

    if (targetLine < startLine) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  // 返回最接近的元素
  if (left >= elements.length) return { element: $(elements[elements.length - 1]), progress: 0 }
  if (right < 0) return { element: $(elements[0]), progress: 0 }
  
  const leftEl = $(elements[left])
  const rightEl = $(elements[right])
  const leftDiff = Math.abs(parseInt(leftEl.attr('data-startline')) - targetLine)
  const rightDiff = Math.abs(parseInt(rightEl.attr('data-startline')) - targetLine)
  
  return { 
    element: leftDiff < rightDiff ? leftEl : rightEl,
    progress: 0 
  }
}

function editScrollingTimeoutInner () {
  editScrolling = false
}
