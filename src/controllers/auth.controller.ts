import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';

export class AuthController {

    constructor(
        private userService: UserService = new UserService()
    ) { }

    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        let user;
        try {
            user = await this.userService.getByEmail(email);
        } catch {
            this.userNotFound(res);
            return;
        }

        if (user && !user.active) {
            this.userUnauthorized(res);
            return;
        }

        if (user && bcrypt.compareSync(password, user.password)) {
            const token = AuthService.generateToken(user);
            res.json({ token });
            return;
        }

        this.userNotFound(res);

    }

    userNotFound(res: Response) {
        res.status(404).json({ message: ["Usuário e/ou senha inválido"] });
    }

    userUnauthorized(res: Response) {
        res.status(401).json({ message: ["Usuário ainda não aprovado pelo administrador"] });
    }

}