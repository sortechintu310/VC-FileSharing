export default (sequelize, DataTypes) => {
  const FileShare = sequelize.define(
    "FileShare",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      fileRecordId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      shareIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      cid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "file_shares",
      timestamps: true,
      indexes: [
        { fields: ["fileRecordId"] },
        { unique: true, fields: ["fileRecordId", "shareIndex"] },
      ],
    }
  );

  FileShare.associate = (models) => {
    FileShare.belongsTo(models.File, {
      foreignKey: "fileRecordId",
      as: "file",
    });
  };

  return FileShare;
};
