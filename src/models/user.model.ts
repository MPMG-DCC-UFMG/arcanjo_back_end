import database from '../config/db';
import sequelize from 'sequelize';
import bcrypt from 'bcrypt';

export const saltRounds = 10;

// Database connection instance
let databaseInstance = new database().database;

// Sequelize Model
export const User: sequelize.Model<UserInterface, {}> = databaseInstance.define<UserInterface, {}>("User", {
    id: {
        type: sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: sequelize.STRING,
        allowNull: false
    },
    role: {
        type: sequelize.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
            isIn: [['user', 'admin']]
        }
    },
    email: {
        type: sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: sequelize.STRING,
        allowNull: false,
        set(this: any, value: string) {
            this.setDataValue('password', bcrypt.hashSync(value, saltRounds));
        }
    },
    active: {
        type: sequelize.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});