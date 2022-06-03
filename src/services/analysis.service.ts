import { Request, Response } from 'express';
import { Analysis } from '../models/analysis.model';
import { ErrorHandling } from '../utils/errorHandling';
import { CliService } from './cli.service';
import fs from 'fs';
import * as path from 'path'

const excelToJson = require('convert-excel-to-json');

export class AnalysisService {

    constructor() { }

    async getAll(userId?: number): Promise<AnalysisInterface[]> {
        try {
            return await Analysis.findAll({ where: { userId } });
        } catch (err) {
            throw err;
        }
    }

    async getById(id: number | string): Promise<AnalysisInterface | null> {
        try {
            const data = await Analysis.findByPk(id);
            if (data && data.id) {
                data.log = this.getLogFromFile(data.id);
                await this.saveIfLogCompleted(data);
                return data;
            } else {
                return null
            }
        } catch (err) {
            throw err
        }
    }

    async saveIfLogCompleted(data: AnalysisInterface) {
        if (data.log.indexOf("Exportando dados para") >= 0 && data.status != 'completed' && data.id) {
            Analysis.update({ status: "completed" }, { where: { id: data.id } })
        }
    }

    async create(data: AnalysisInterface, user: UserInterface): Promise<AnalysisInterface> {
        try {
            return await Analysis.create({ ...data, ...{ userId: user.id } });
        } catch (err) {
            throw ErrorHandling.fixSequelizeErrors(err);
        }
    }

    async update(id: number | string, data: AnalysisInterface | any): Promise<UpdateResponse> {
        try {
            const [updatedRows] = await Analysis.update(data, {
                where: { id }
            });
            return { updatedRows }
        } catch (err) {
            throw err
        }
    }

    async delete(id: number | string): Promise<DeleteResponse> {
        try {
            const deletedRows = await Analysis.destroy({
                where: { id }
            });
            return { deletedRows }
        } catch (err) {
            throw err
        }
    }

    async process(id: number | string, user: string) {
        const cliService = new CliService();
        cliService.processAnalysis(id, user);
    }

    report(id: number | string, replaceThumbPath: boolean = false) {
        const images = this.imageReport(id);
        const videos = this.videoReport(id, images.length, replaceThumbPath);

        return [
            ...images,
            ...videos
        ]
    }

    imageReport(id: number | string) {
        const resultsDir = process.env.RESULTS_DIR || `${__dirname}/../../results`;
        const dir = `${resultsDir}/ID_${id}`;
        const files = fs.readdirSync(dir);
        const xlsx = files.find(file => file.indexOf(".xlsx") >= 0 && file.indexOf(".") > 1 && file.indexOf("imagens") > 1);

        if (!xlsx) return [];

        const result = excelToJson({
            sourceFile: `${dir}/${xlsx}`,
            header: {
                rows: 1
            },
            columnToKey: {
                A: 'id',
                B: 'file',
                C: 'hash',
                D: 'nsfw',
                E: 'faces',
                F: 'ages',
                G: 'children',
                H: 'classification',
            }
        });

        const dirPrefix = process.env.DIR_PREFIX || "";

        const response = result.Sheet1.map((item: AnalysisReportInterface) => ({
            ...item,
            ...{
                file: item.file.replace(dirPrefix, "/"),
                type: "image"
            }
        }));

        return response;
    }

    videoReport(id: number | string, idOffset: number = 0, replaceThumbPath: boolean = false) {
        const resultsDir = process.env.RESULTS_DIR || `${__dirname}/../../results`;
        const dir = `${resultsDir}/ID_${id}`;
        const files = fs.readdirSync(dir);
        const xlsx = files.find(file => file.indexOf(".xlsx") >= 0 && file.indexOf(".") > 1 && file.indexOf("videos") > 1);

        if (!xlsx) return [];

        const result = excelToJson({
            sourceFile: `${dir}/${xlsx}`,
            header: {
                rows: 1
            },
            columnToKey: {
                A: 'id',
                B: 'file',
                C: 'hash',
                D: 'thumbnail',
                E: 'timestamp',
                F: 'classification'
            }
        });

        const dirPrefix = process.env.DIR_PREFIX || "";

        const response = result.Sheet1.map((item: AnalysisReportInterface) => ({
            ...item,
            ...{
                id: item.id + idOffset,
                file: item.file.replace(dirPrefix, "/"),
                thumbnail: replaceThumbPath ? this.replacedThumbPath(item.thumbnail) : item.thumbnail,
                type: "video"
            }
        }));


        return response;
    }

    replacedThumbPath(path: string | undefined) {
        const prefix = process.env.THUMB_PREFIX || '/';
        return path?.replace("/m08/M08/", prefix);
    }

    filteredReport(id: number | string, ids?: string[], replaceThumbPath: boolean = false) {
        let data: any[] = this.report(id, replaceThumbPath);

        if (ids && ids.length > 0)
            data = data.filter(d => ids.indexOf(d.id.toString()) >= 0)

        return data;
    }

    getLogFromFile(id: string | number): string {
        const dir = path.resolve(`results/ID_${id}`);
        if (!fs.existsSync(dir)) return "";

        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file.indexOf("log_ID_") >= 0) {
                return fs.readFileSync(`${dir}/${file}`, { encoding: "utf-8" });
            }
        }
        return "";
    }
}