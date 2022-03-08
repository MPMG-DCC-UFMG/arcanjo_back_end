import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';
import { DirectorySelectorService } from '../services/directorySelector.service';

export class DirectorySelectorController {

    constructor(
        private directorySelectorService: DirectorySelectorService = new DirectorySelectorService()
    ) { }

    getDir(req: Request, res: Response) {
        const dirContent = this.directorySelectorService.getDirectoriesListByPath(req.query.path?.toString());
        res.json(dirContent);
    }

    fileTypeAvailability(req: Request, res: Response) {
        const dirContent = this.directorySelectorService.getFileTypeAvailability(req.query.path?.toString());
        res.json(dirContent);
    }

}