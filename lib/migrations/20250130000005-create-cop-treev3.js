'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('CopTreeV3', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      noteId: {
        type: Sequelize.UUID,
        allowNull: false,
        index: true
      },
      noteShortId: {
        type: Sequelize.STRING,
        allowNull: false,
        index: true
      },
      noteAlias: {
        type: Sequelize.STRING,
        allowNull: false,
        index: true
      },
      fileId: {
        type: Sequelize.STRING
      },
      parentFileId: {
        type: Sequelize.STRING
      }, 
      majorVersion: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      minorVersion: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      patchVersion: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('CopTreeV3')
  }
} 