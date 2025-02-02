'use strict'

exports.isSQLite = function isSQLite(sequelize) {
  return sequelize.options.dialect === 'sqlite'
}

exports.isMySQL = function isMySQL(sequelize) {
  return ['mysql', 'mariadb'].includes(sequelize.options.dialect)
}

exports.getImageMimeType = function getImageMimeType(imagePath) {
  const fileExtension = /[^.]+$/.exec(imagePath)

  switch (fileExtension[0].toLowerCase()) {
    case 'bmp':
      return 'image/bmp'
    case 'gif':
      return 'image/gif'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'tiff':
      return 'image/tiff'
    case 'svg':
      return 'image/svg+xml'
    default:
      return undefined
  }
}

exports.useUnless = function excludeRoute(paths, middleware) {
  return function (req, res, next) {
    if (paths.includes(req.path)) {
      return next()
    }
    return middleware(req, res, next)
  }
}


exports.makeId = function makeId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}