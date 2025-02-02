'use strict'

const models = require('../../models')
const logger = require('../../logger')
const config = require('../../config')
const errors = require('../../errors')

const noteUtil = require('./util')
const noteActions = require('./actions')

const { execFile } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
const moment = require('moment')
const realtime = require('../../realtime')

exports.publishNoteActions = function (req, res, next) {
  noteUtil.findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'download':
        exports.downloadMarkdown(req, res, note)
        break
      case 'edit':
        res.redirect(config.serverURL + '/' + (note.alias ? note.alias : models.Note.encodeNoteId(note.id)) + '?both')
        break
      default:
        res.redirect(config.serverURL + '/s/' + note.shortid)
        break
    }
  })
}

exports.showPublishNote = function (req, res, next) {
  const include = [{
    model: models.User,
    as: 'owner'
  }, {
    model: models.User,
    as: 'lastchangeuser'
  }]
  noteUtil.findNote(req, res, function (note) {
    // force to use short id
    const shortid = req.params.shortid
    if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) {
      return res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
    }
    note.increment('viewcount').then(function (note) {
      if (!note) {
        return errors.errorNotFound(res)
      }
      noteUtil.getPublishData(req, res, note, (data) => {
        res.set({
          'Cache-Control': 'private' // only cache by client
        })
        return res.render('pretty.ejs', data)
      })
    }).catch(function (err) {
      logger.error(err)
      return errors.errorInternalError(res)
    })
  }, include)
}

exports.showNote = function (req, res, next) {
  noteUtil.findNote(req, res, function (note) {
    // force to use note id
    const noteId = req.params.noteId
    const id = models.Note.encodeNoteId(note.id)
    if ((note.alias && noteId !== note.alias) || (!note.alias && noteId !== id)) {
      return res.redirect(config.serverURL + '/' + (note.alias || id))
    }
    const body = note.content
    const extracted = models.Note.extractMeta(body)
    const meta = models.Note.parseMeta(extracted.meta)
    let title = models.Note.decodeTitle(note.title)
    title = models.Note.generateWebTitle(meta.title || title)
    if (extracted.meta.cop) {
      title = `${title}-v${extracted.meta.major_version}.${extracted.meta.minor_version}.${extracted.meta.patch_version}`
    }
    const opengraph = models.Note.parseOpengraph(meta, title)
    res.set({
      'Cache-Control': 'private', // only cache by client
      'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
    })
    return res.render('hedgedoc.ejs', {
      title,
      opengraph
    })
  }, null, true)
}

exports.createFromPOST = function (req, res, next) {
  if (config.disableNoteCreation) {
    return errors.errorForbidden(res)
  }

  if (!req.isAuthenticated()) {
    return errors.errorForbidden(res)
  }
  let body = ''
  if (req.body && req.body.length > config.documentMaxLength) {
    return errors.errorTooLong(res)
  } else if (typeof req.body === 'string') {
    body = req.body
  } else {
    try {
      body = exports.templateCache
      body = body.replace('{modify_date}', moment().format('YYYY.MM.DD'))
      body = body.replace('{dateid}', moment().format('YYYYMMDD'))
    } catch (err) {
      logger.error('Failed to read template:', err)
      return errors.errorInternalError(res)
    }
  }
  
  body = body.replace(/[\r]/g, '')
  return noteUtil.newNote(req, res, body)
}

exports.publishNote = function (req, res, note) {
  const extracted = models.Note.extractMeta(note.content)
  if (extracted.meta.cop && req.isAuthenticated()) {
    extracted.meta.major_version = extracted.meta.major_version || 1
    extracted.meta.minor_version = extracted.meta.minor_version || 0
    extracted.meta.patch_version = extracted.meta.patch_version === undefined ? -1 : extracted.meta.patch_version + 1
    models.Revision.getLatestRevision(note.id, true, function (err, revision) {
      if (err || !revision) {
        models.Revision.saveNoteRevision(note, function (err, revision) {
          if (err) return res.status(400).send(err.message)
          res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
        }, true)
        return
      }
      const lastContent = revision.content || revision.lastContent
      if (lastContent === note.content) {
        return res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
      }
      note.update({
        content: models.Note.generateCopNote(note.content, extracted.meta)
      }).then(note => {
        // 构造广播数据
        var docOut = {
          str: note.content,
          revision: -1,
          clients: []
        };
        realtime.io.to(note.id).emit('doc', docOut);
        return note
      }).then(note => {
        models.Revision.saveNoteRevision(note, function (err, revision) {
          if (err) return res.status(400).send(err.message)
          res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
        }, true)
      })

      console.log(revision)
    })
  } else {
    models.Revision.saveNoteRevision(note, function (err, revision) {
      if (err) return res.status(400).send(err.message)
      res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
    }, true)
  }
}

exports.doAction = function (req, res, next) {
  const noteId = req.params.noteId
  noteUtil.findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'publish':
      case 'pretty': // pretty deprecated
        exports.publishNote(req, res, note)
        break
      case 'slide':
        res.redirect(config.serverURL + '/p/' + (note.alias || note.shortid))
        break
      case 'download':
        exports.downloadMarkdown(req, res, note)
        break
      case 'info':
        noteActions.getInfo(req, res, note)
        break
      case 'gist':
        noteActions.createGist(req, res, note)
        break
      case 'revision':
        noteActions.getRevision(req, res, note)
        break
      default:
        return res.redirect(config.serverURL + '/' + noteId)
    }
  })
}

exports.downloadMarkdown = function (req, res, note) {
  const body = note.content
  let filename = models.Note.decodeTitle(note.title)
  filename = encodeURIComponent(filename)
  res.set({
    'Access-Control-Allow-Origin': '*', // allow CORS as API
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
    'Content-Type': 'text/markdown; charset=UTF-8',
    'Cache-Control': 'private',
    'Content-disposition': 'attachment; filename=' + filename + '.md',
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.send(body)
}

exports.convertDocx = function (req, res, next) {
  const body = req.body.markdown
  
  // 创建临时文件来存储 markdown 内容
  const tmpDir = os.tmpdir()
  const timestamp = Date.now()
  const tmpFile = path.join(tmpDir, `tmp_${timestamp}.md`)
  const tmpDocx = path.join(tmpDir, `tmp_${timestamp}.docx`)
  
  fs.writeFileSync(tmpFile, body)
  
  // 执行转换命令
  execFile('cop_tool', ['server_docx', tmpFile, tmpDocx], { encoding: 'buffer' }, (error, stdout, stderr) => {
    // 读取生成的 docx 文件并发送
    if(error){
      return res.status(400).send(error.message)
    }

    fs.readFile(tmpDocx, (err, data) => {
      // 清理临时文件
      fs.unlinkSync(tmpFile)
      if (fs.existsSync(tmpDocx)) {
        fs.unlinkSync(tmpDocx)
      }

      if (err) {
        logger.error('Read docx failed:', err)
        return errors.errorInternalError(res)
      }

      // 设置响应头并发送文件内容
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=converted.docx'
      })
      res.send(data)
    })
  })
}

exports.getCopTreeInfo = async function (req, res) {
  try {
    const trees = await models.CopTreeV3.findAll({
      where: {
        fileId: {
          [models.Sequelize.Op.ne]: ''  // fileId 不为空字符串
        }
      },
      attributes: ['fileId', 'parentFileId', 'title', 'majorVersion', 'minorVersion', 'patchVersion', 'noteId', 'noteShortId']
    })
    res.json(trees)
  } catch (err) {
    logger.error('Get cop tree failed:', err)
    return errors.errorInternalError(res)
  }
}

if (!exports.templateCache) {
  exports.templateCache = fs.readFileSync(
    path.resolve(__dirname, './template.md'),
    'utf-8'
  )
}