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
            const removeStoragePrefix = Boolean(req.query.removeStoragePrefix);
            if (req.query.file)
                res.sendFile(`${removeStoragePrefix ? "" : dirPrefix}${req.query.file.toString()}`);
            else
                res.sendStatus(400)
        } catch {
            res.sendStatus(400);
        }
    }

    async getReport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const resultsDir = process.env.RESULTS_DIR || `${__dirname}/../../results`;
            const dir = `${resultsDir}/ID_${id}`;
            const files = fs.readdirSync(dir);
            const xlsx = files.find(file => file.indexOf(".xlsx") >= 0 && file.indexOf(".") > 1);

            res.download(path.resolve(`${dir}/${xlsx}`));
        } catch (e) {
            console.log(e);
            res.sendStatus(400);
        }
    }

}