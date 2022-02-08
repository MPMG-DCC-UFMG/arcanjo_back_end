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

    async process(id: number | string) {
        const cliService = new CliService();
        cliService.processAnalysis(id);
    }

    report(id: number | string) {
        const dir = `${__dirname}/../results/ID_${id}`;
        const files = fs.readdirSync(dir);
        const xlsx = files.find(file => file.indexOf(".xlsx") >= 0);

        if (!xlsx) throw "Not found";

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

        const response = result.Sheet1.map((item: AnalysisReportInterface) => ({
            ...item,
            ...{
                file: item.file.replace("/m08/storage/", "")
            }
        }));

        return response;
    }
}