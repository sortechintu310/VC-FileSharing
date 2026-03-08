export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      paranoid: true,

      indexes: [
        { unique: true, fields: ["email"] },
        { fields: ["isActive"] },
      ],

      hooks: {
        beforeValidate: (user) => {
          if (user.email) user.email = user.email.trim().toLowerCase();
          if (user.fullName) user.fullName = user.fullName.trim();
        },
      },
    }
  );

  return User;
};