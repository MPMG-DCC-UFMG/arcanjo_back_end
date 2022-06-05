import database from '../config/db';
import sequelize from 'sequelize';

// Database connection instance
let databaseInstance = new database().database;

// Sequelize Model
export const Analysis: sequelize.Model<AnalysisInterface, {}> = databaseInstance.define<AnalysisInterface, {}>("Analysis", {
    id: {
        type: sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: sequelize.INTEGER,
        allowNull: false
    },
    name: {
        type: sequelize.STRING,
        allowNull: false
    },
    path: {
        type: sequelize.STRING,
        allowNull: false,
    },
    image: {
        type: sequelize.BOOLEAN
    },
    video: {
        type: sequelize.BOOLEAN
    },
    porn_threshold: {
        type: sequelize.FLOAT
    },
    face_threshold: {
        type: sequelize.FLOAT
    },
    child_threshold: {
        type: sequelize.FLOAT
    },
    age_threshold: {
        type: sequelize.FLOAT
    },
    log: {
        type: sequelize.TEXT,
        allowNull: true
    },
    status: {
        type: sequelize.STRING,
        defaultValue: 'created',
        validate: {
            isIn: [['created', 'processing', 'completed', 'error']]
        }
    }
}, {
    timestamps: true
});