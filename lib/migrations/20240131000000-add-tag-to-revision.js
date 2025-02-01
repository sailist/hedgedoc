'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Revisions', 'tag', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Revisions', 'tag')
  }
} 