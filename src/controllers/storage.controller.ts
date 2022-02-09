import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const mime: any = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

export class StorageController {

    constructor(
    ) { }

    async getFile(req: Request, res: Response) {
        try {
            const dirPrefix = process.env.DIR_PREFIX || "";
            if (req.query.file)
                res.sendFile(dirPrefix + req.query.file.toString());
            else
                res.sendStatus(400)
        } catch {
            res.sendStatus(400);
        }
    }

}