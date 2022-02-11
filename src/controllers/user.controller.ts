import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';

export class UserController {

    constructor(
        private userService: UserService = new UserService()
    ) { }

    async readAll(req: Request, res: Response) {
        try {
            const users = await this.userService.getAll();
            res.json(users);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async read(req: Request, res: Response) {
        try {
            const id: number | string = req.params.id;
            const user = await this.userService.getById(id === "me" ? req.body.user.id : id);
            if (user)
                res.json(user);
            else
                res.sendStatus(404)
        } catch (err) {
            console.log(err);
            res.status(400).json(err);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const user = await this.userService.create(req.body);
            res.json(user);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const response = await this.userService.update(req.params.id, req.body);
            res.json(response);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const response = await this.userService.delete(req.params.id);
            res.json(response);
        } catch (err) {
            res.status(400).json(err);
        }

    }
}