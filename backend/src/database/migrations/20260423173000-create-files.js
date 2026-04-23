export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("files", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },

      fileId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      fileName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      mimeType: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },

      originalFileHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      shareCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },

      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      blockchainTxHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      blockchainBlockNumber: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      contractAddress: {
        type: Sequelize.STRING,
        allowNull: true,
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

      deletedAt: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("files", ["ownerId"]);
    await queryInterface.addIndex("files", ["status"]);
    await queryInterface.addIndex("files", ["fileId"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("files");
  },
};
