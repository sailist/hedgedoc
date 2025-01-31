const models = require('../../models')
const logger = require('../../logger')
const config = require('../../config')
const errors = require('../../errors')
const fs = require('fs')
const path = require('path')
const jsyaml = require('js-yaml')

exports.findNote = function (req, res, callback, include = null, createIfNotFound = false) {
  const id = req.params.noteId || req.params.shortid
  models.Note.parseNoteId(id, function (err, _id) {
    if (err) {
      logger.error(err)
      return errors.errorInternalError(res)
    }
    models.Note.findOne({
      where: {
        id: _id
      },
      include: include || null
    }).then(function (note) {
      if (!note.alias && note.id !== id) {
        note.update({
          alias: id
        })
      }

      if (!note && createIfNotFound) {
        if (config.disableNoteCreation) {
          return errors.errorNotFound(res)
        } else {
          return exports.newNote(req, res, '')
        }
      }
      if (!note && !createIfNotFound) {
        return errors.errorNotFound(res)
      }
      if (!exports.checkViewPermission(req, note)) {
        return errors.errorForbidden(res)
      } else {
        return callback(note)
      }
    }).catch(function (err) {
      logger.error(err)
      return errors.errorInternalError(res)
    })
  })
}

exports.checkViewPermission = function (req, note) {
  if (note.permission === 'private') {
    return !(!req.isAuthenticated() || note.ownerId !== req.user.id)
  } else if (note.permission === 'limited' || note.permission === 'protected') {
    return req.isAuthenticated()
  } else {
    return true
  }
}

exports.newNote = async function (req, res, body) {
  let owner = null
  const noteId = req.params.noteId ? req.params.noteId : null
  if (req.isAuthenticated()) {
    owner = req.user.id
  } else if (!config.allowAnonymous) {
    return errors.errorForbidden(res)
  }
  if (noteId) {
    try {
      const note = await models.Note.findOne({ where: { alias: noteId } })
      if (note) {
        await note.update({
          content: body,
          title: models.Note.parseNoteTitle(body)
        })
        const extract = models.Note.extractMeta(body)
        if (extract.meta.cop) {
          await models.CopTreeV3.createOrUpdate({
            noteId: note.id,
            noteShortId: note.shortid,
            noteAlias: note.alias,
            fileId: extract.meta.file_id,
            parentFileId: extract.meta.parent_file_id,
            majorVersion: extract.meta.major_version || 1,
            minorVersion: extract.meta.minor_version || 0,
            patchVersion: extract.meta.patch_version || 0,
            title: extract.meta.title || title
          })
        }

        return res.redirect(config.serverURL + '/' + noteId)
      }
    } catch (error) {
      logger.error(error)
      return errors.errorInternalError(res)
    }
  }
  models.Note.create({
    ownerId: owner,
    alias: req.alias ? req.alias : req.params.noteId,
    content: body,
    title: models.Note.parseNoteTitle(body)
  }).then(async function (note) {
    const extract = models.Note.extractMeta(body)
    const alias = note.alias ? note.alias : models.Note.encodeNoteId(note.id);
    if (extract.meta.cop) {
      await models.CopTreeV3.createOrUpdate({
        noteId: note.id,
        noteShortId: note.shortid,
        noteAlias: alias,
        fileId: extract.meta.file_id,
        parentFileId: extract.meta.parent_file_id,
        majorVersion: extract.meta.major_version || 1,
        minorVersion: extract.meta.minor_version || 0,
        patchVersion: extract.meta.patch_version || 0,
        title: extract.meta.title || title
      })
    }
    return res.redirect(config.serverURL + '/' + alias)
  }).catch(function (err) {
    logger.error('Note could not be created: ' + err)
    return errors.errorInternalError(res)
  })
}

exports.getPublishData = function (req, res, note, callback) {
  const body = note.content
  const extracted = models.Note.extractMeta(body)
  let markdown = extracted.markdown
  const meta = models.Note.parseMeta(extracted.meta)
  // extractMeta() will remove the meta part from markdown,
  // so we need to re-add the `breaks` option for proper rendering
  if (typeof extracted.meta.breaks === 'boolean') {
    markdown = '---\nbreaks: ' + extracted.meta.breaks + '\n---\n' + markdown
  }
  const createtime = note.createdAt
  const updatetime = note.lastchangeAt
  let title = models.Note.decodeTitle(note.title)
  title = models.Note.generateWebTitle(meta.title || title)

  if (extracted.meta.cop) {
    title = `${title}-v${extracted.meta.major_version || 1}.${extracted.meta.minor_version || 0}.${extracted.meta.patch_version || 0}`
  }

  const ogdata = models.Note.parseOpengraph(meta, title)
  const data = {
    title,
    description: meta.description || (markdown ? models.Note.generateDescription(markdown) : null),
    lang: meta.lang || null,
    viewcount: note.viewcount,
    createtime,
    updatetime,
    body: markdown,
    theme: meta.slideOptions && isRevealTheme(meta.slideOptions.theme),
    meta: JSON.stringify(extracted.meta),
    metaContent: jsyaml.dump(extracted.meta),
    owner: note.owner ? note.owner.id : null,
    ownerprofile: note.owner ? models.User.getProfile(note.owner) : null,
    lastchangeuser: note.lastchangeuser ? note.lastchangeuser.id : null,
    lastchangeuserprofile: note.lastchangeuser ? models.User.getProfile(note.lastchangeuser) : null,
    robots: meta.robots || false, // default allow robots
    GA: meta.GA,
    disqus: meta.disqus,
    cspNonce: res.locals.nonce,
    dnt: req.headers.dnt,
    opengraph: ogdata
  }
  callback(data)
}

function isRevealTheme (theme) {
  if (fs.existsSync(path.join(__dirname, '..', '..', '..', 'public', 'build', 'reveal.js', 'css', 'theme', theme + '.css'))) {
    return theme
  }
  return undefined
}
