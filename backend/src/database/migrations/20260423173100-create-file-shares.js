export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("file_shares", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },

      fileRecordId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "files",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      shareIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      cid: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("file_shares", ["fileRecordId"]);
    await queryInterface.addIndex("file_shares", ["fileRecordId", "shareIndex"], {
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("file_shares");
  },
};
