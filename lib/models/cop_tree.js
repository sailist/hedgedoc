'use strict'

module.exports = function (sequelize, DataTypes) {
  const CopTreeV3 = sequelize.define('CopTreeV3', {
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
    tableName: 'CopTreeV3'
  })

  // 添加一些辅助方法
  CopTreeV3.getVersionString = function () {
    return `v${this.majorVersion}.${this.minorVersion}.${this.patchVersion}`
  }
  CopTreeV3.createOrUpdate = async function ({ noteId, noteShortId, noteAlias, fileId, parentFileId, majorVersion, minorVersion, patchVersion, title }) {
    const existing = await CopTreeV3.findOne({ where: { noteId } });

    if (existing) {
      // 如果记录存在，则更新
      return existing.update({
        fileId,
        parentFileId,
        majorVersion,
        minorVersion,
        patchVersion,
        title,
        noteShortId,
        noteAlias
      });
    } else {
      // 如果记录不存在，则创建新记录
      return CopTreeV3.create({
        noteId,
        fileId,
        parentFileId,
        majorVersion,
        minorVersion,
        patchVersion,
        title,
        noteShortId,
        noteAlias
      });
    }
  }
  return CopTreeV3
}
