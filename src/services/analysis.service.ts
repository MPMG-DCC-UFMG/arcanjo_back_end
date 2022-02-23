import { Request, Response } from 'express';
import { Analysis } from '../models/analysis.model';
import { ErrorHandling } from '../utils/errorHandling';
import { CliService } from './cli.service';
import fs from 'fs';

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
            return await Analysis.findByPk(id);
        } catch (err) {
            throw err
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

    report(id: number | string) {
        const images = this.imageReport(id);
        const videos = this.videoReport(id, images.length);

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

    videoReport(id: number | string, idOffset: number = 0) {
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
                type: "video"
            }
        }));


        return response;
    }

    filteredReport(id: number | string, ids?: string[]) {
        let data: any[] = this.report(id);

        if (ids && ids.length > 0)
            data = data.filter(d => ids.indexOf(d.id.toString()) >= 0)

        return data;
    }
}