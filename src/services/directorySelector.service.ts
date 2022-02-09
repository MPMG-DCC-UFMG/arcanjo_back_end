import fs from 'fs';

export class DirectorySelectorService {

    constructor() { }

    getDirectoryByPath(path?: string) {
        const dirPrefix = process.env.DIR_PREFIX || "";
        const currentPath = path || "/";
        const finalPath = dirPrefix+currentPath;
        const contents: string[] = fs.readdirSync(finalPath);
        const onlyDir = contents.filter(path => {
            try {
                return fs.lstatSync(`${finalPath}/${path}`).isDirectory()
            } catch {
                return false;
            }
        })

        return {
            path: currentPath,
            contents: onlyDir
        };
    }
}