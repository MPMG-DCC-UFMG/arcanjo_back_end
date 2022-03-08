import fs from 'fs';
import _ from 'lodash';

const videoExtensions: string[] = ['wav', 'qt', 'mpeg', 'mpg', 'avi', 'mp4', '3gp', 'mov', 'lvl', 'm4v', 'wmv'];
const imageExtensions: string[] = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'];

export class DirectorySelectorService {

    constructor() { }

    getFinalPath(path?: string) {
        const dirPrefix = process.env.DIR_PREFIX || "";
        const currentPath = path || "/";
        return dirPrefix + currentPath;
    }

    getDirectoriesListByPath(path?: string) {
        const currentPath = path || "/";
        const finalPath = this.getFinalPath(path);
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

    walkSync(dir: string) {
        const files = fs.readdirSync(dir);
        let fileList: string[] = [];
        files.forEach((file) => {
            if (fs.statSync(dir + '/' + file).isDirectory()) {
                fileList = [...fileList, ...this.walkSync(dir + '/' + file)];
            } else {
                fileList.push(file);
            }
        });
        return fileList;
    };


    getFileTypeAvailability(path?: string) {
        const finalPath = this.getFinalPath(path);
        const contents: string[] = this.walkSync(finalPath);
        const availability = {
            videos: 0,
            images: 0
        }

        for (const file of contents) {
            const ext = _.last(file.split("."));
            if (ext && imageExtensions.includes(ext)) {
                availability.images += 1;
            } else if (ext && videoExtensions.includes(ext)) {
                availability.videos += 1;
            }
        }

        return availability;
    }
}