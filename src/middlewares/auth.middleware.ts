import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export class AuthMiddleware {

    constructor(

    ) { }


    async validateToken(req: Request, res: Response, next: NextFunction) {
        const userService = new UserService();

        if (!req.headers.authorization) {
            res.sendStatus(401);
            return;
        }

        const token: string = _.last(req.headers.authorization.split(" ")) || "";
        if (!AuthService.validateToken(token)) {
            res.sendStatus(401);
            return;
        }

        const user = AuthService.decodeToken(token);

        if (!await userService.validateSessionId(user)) {
            res.sendStatus(401);
            return;
        }

        req.body.user = user;
        next();
    }
}