import fs from 'fs';


export class DirectorySelectorService {

    constructor() { }

    getDirectoryByPath(path?: string) {
        const currentPath = path || "/";
        console.log(currentPath);
        const contents: string[] = fs.readdirSync(currentPath);
        const onlyDir = contents.filter(path => {
            try {
                return fs.lstatSync(`${currentPath}/${path}`).isDirectory()
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