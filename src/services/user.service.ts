import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { ErrorHandling } from '../utils/errorHandling';

export class UserService {

    constructor() { }

    async getAll(): Promise<UserInterface[]> {
        try {
            return await User.findAll();
        } catch (err) {
            throw err;
        }
    }

    async count(): Promise<number> {
        try {
            return await User.count();
        } catch (err) {
            throw err;
        }
    }

    async getById(id: number | string): Promise<UserInterface | null> {
        try {
            return await User.findByPk(id);
        } catch (err) {
            throw err
        }
    }

    async getByEmail(email: string): Promise<UserInterface | null> {
        try {
            return await User.findOne({
                where: { email }
            });
        } catch (err) {
            throw err
        }
    }

    async create(user: UserInterface): Promise<UserInterface> {
        try {
            if (await this.count() === 0)
                user.role = 'admin';

            return await User.create(user);
        } catch (err) {
            throw ErrorHandling.fixSequelizeErrors(err);
        }
    }

    async update(id: number | string, user: UserInterface): Promise<UpdateResponse> {
        try {
            const [updatedRows] = await User.update(user, {
                where: { id }
            });
            return { updatedRows }
        } catch (err) {
            throw err
        }
    }

    async delete(id: number | string): Promise<DeleteResponse> {
        try {
            const deletedRows = await User.destroy({
                where: { id }
            });
            return { deletedRows }
        } catch (err) {
            throw err
        }
    }
}