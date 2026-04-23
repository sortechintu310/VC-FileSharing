export default (sequelize, DataTypes) => {
  const File = sequelize.define(
    "File",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      fileId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      mimeType: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      originalFileHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      shareCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },

      failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      blockchainTxHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      blockchainBlockNumber: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },

      contractAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "files",
      timestamps: true,
      paranoid: true,
      indexes: [
        { unique: true, fields: ["fileId"] },
        { fields: ["ownerId"] },
        { fields: ["status"] },
      ],
    }
  );

  File.associate = (models) => {
    File.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });

    File.hasMany(models.FileShare, {
      foreignKey: "fileRecordId",
      as: "shares",
      onDelete: "CASCADE",
      hooks: true,
    });
  };

  return File;
};
