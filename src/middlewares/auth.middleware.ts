import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
export class AuthMiddleware {

    constructor(
        private userService = new UserService()
    ) { }


    async validateToken(req: Request, res: Response, next: NextFunction) {
        if (!req.headers.authorization) {
            res.sendStatus(401);
            return;
        }

        const token: string = _.last(req.headers.authorization.split(" ")) || "";
        if (AuthService.validateToken(token)) {
            const user = AuthService.decodeToken(token);
            req.body.user = user;
            next();
        } else {
            res.sendStatus(401);
        }
    }
}