'use strict'
const moment = require('moment')
const { makeId } = require('../utils')
module.exports = function (sequelize, DataTypes) {
  const CopTreeV2 = sequelize.define('CopTreeV2', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    noteId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },
    noteShortId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true
    },
    noteAlias: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true
    },
    fileId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parentFileId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    majorVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    minorVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    patchVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'CopTreeV2'
  })

  // 添加一些辅助方法
  CopTreeV2.getVersionString = function () {
    return `v${this.majorVersion}.${this.minorVersion}.${this.patchVersion}`
  }
  CopTreeV2.createOrUpdate = async function ({ noteId, noteShortId, noteAlias, fileId, parentFileId, majorVersion, minorVersion, patchVersion, title, cop }) {
    const existing = await CopTreeV2.findOne({ where: { noteId } });

    if (!cop) {
      fileId = ""
      parentFileId = ""
    } else {
      const existFileId = await CopTreeV2.findOne({ where: { fileId: `${fileId}` } });
      if (existFileId) {
        if (!existing || existFileId.noteId !== existing.noteId) {
          // 如果文件ID已经存在，则那不允许这个文件抢占
          fileId = "FIL-C-" + moment().format('YYYYMMDD') + "-" + makeId(6) + "-" + makeId(3)
          parentFileId = "DUPLICATED-FILE-ID"
        }
      }
    }
    
    if (existing) {
      // 如果记录存在，则更新
      return existing.update({
        fileId: `${fileId}`,
        parentFileId: `${parentFileId}`,
        majorVersion,
        minorVersion,
        patchVersion,
        title,
        noteShortId,
        noteAlias
      });
    } else {
      // 如果记录不存在，则创建新记录
      return CopTreeV2.create({
        noteId,
        fileId: `${fileId}`,
        parentFileId: `${parentFileId}`,
        majorVersion,
        minorVersion,
        patchVersion,
        title,
        noteShortId,
        noteAlias
      });
    }
  }
  return CopTreeV2
}
