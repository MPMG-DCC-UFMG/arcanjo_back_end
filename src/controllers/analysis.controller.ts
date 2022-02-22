import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysis.service';

export class AnalysisController {

    constructor(
        private analysisService: AnalysisService = new AnalysisService(),
    ) { }

    async readAll(req: Request, res: Response) {
        try {
            const analysis = await this.analysisService.getAll(req.body.user.id);
            res.json(analysis);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async read(req: Request, res: Response) {
        try {
            const user = await this.analysisService.getById(req.params.id);
            if (user)
                res.json(user);
            else
                res.sendStatus(404)
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const user = await this.analysisService.create(req.body, req.body.user);
            res.json(user);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const response = await this.analysisService.update(req.params.id, req.body);
            res.json(response);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const response = await this.analysisService.delete(req.params.id);
            res.json(response);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async process(req: Request, res: Response) {
        try {
            const response = this.analysisService.process(req.params.id);
            res.sendStatus(200);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async report(req: Request, res: Response) {
        try {
            const response = this.analysisService.report(req.params.id);
            res.send(response);
        } catch (err) {
            res.status(400).json(err);
        }
    }

    async exportReport(req: Request, res: any) {
        try {
            const response = this.analysisService.filteredReport(req.params.id, req.query.ids ? req.query.ids.toString().split(",") : []);
            const report = await this.analysisService.getById(req.params.id);
            res.xls(`Relatório ${report?.name}.xlsx`, response);
        } catch (err) {
            res.status(400).json(err);
        }
    }
}