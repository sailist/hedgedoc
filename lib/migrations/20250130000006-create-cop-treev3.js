'use strict'

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('CopTreeV2', {
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
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('CopTreeV2')
  }
} 