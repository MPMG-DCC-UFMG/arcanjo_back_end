import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysis.service';
import { UserService } from '../services/user.service';

const fs = require('fs');
const PDFDocument = require('pdfkit');


export class AnalysisController {

    constructor(
        private analysisService: AnalysisService = new AnalysisService(),
        private userService: UserService = new UserService(),
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
            const response = this.analysisService.process(req.params.id, req.body.user.name);
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

    async getReportData(req: Request, res: any) {
        let response = this.analysisService.filteredReport(req.params.id, req.query.ids ? req.query.ids.toString().split(",") : [], true);
        const report = await this.analysisService.getById(req.params.id);

        if (!report) {
            res.status(400).send("Report not found");
            return {};
        }

        const user = await this.userService.getById(report.userId || 0);

        response = response.map(resp => ({
            ...resp,
            name: user?.name,
            email: user?.email,
            date: report?.createdAt.toLocaleString('pt-BR')
        }))

        return { response, report };
    }

    async exportReport(req: Request, res: any) {
        try {
            const { response, report } = await this.getReportData(req, res);
            if (!response) return;

            res.xls(`Relatório ${report?.name}.xlsx`, response, {
                fields: ['id', 'file', 'hash', 'nsfw', 'faces', 'ages', 'children', 'classification', 'timestamp', 'thumbnail', 'type', 'name', 'email', 'date']
            });
        } catch (err) {
            res.status(400).json(err);
        }
    }

    getColorByClassification(classification: string) {
        if (classification.indexOf("pornografia") >= 0 && classification.indexOf("menores de idade") >= 0)
            return "#FECACA";
        if (classification.indexOf("pornografia") >= 0)
            return "#FFEDD5";
        if (classification.indexOf("menores de idade") >= 0)
            return "#DBEAFE";
        return "#F1F4F9";
    }

    async exportPdf(req: Request, res: any) {
        try {
            const { response, report } = await this.getReportData(req, res);
            if (!response) return;
            res.contentType("application/pdf");

            const doc = new PDFDocument({ compress: false });
            doc.pipe(res);

            doc.image('./assets/logo_mpmg.jpg', 220, 30, { width: 150 })

            doc
                .moveDown()
                .moveDown()
                .moveDown()
                .fontSize(18)
                .text('Relatório Automático', { align: 'center' })
                .moveDown()
                .fontSize(12)
                .text('Software: Arcanjo - Sistema para identificação de pedofilia em imagens e vídeos')
                .text(`Versão: ${process.env.VERSION_DATE}`)
                .moveDown()
                .moveDown()
                .text(`Código identificador da análise: ${report?.id}`)
                .text(`Total de registros processados: ${response.length}`)
                .text(`Total de imagens processadas: ${response.filter(d => d.type === "image").length}`)
                .text(`Total de vídeos processados:  ${response.filter(d => d.type === "video").length}`)
                .text(`Data e hora: ${report?.createdAt.toLocaleString('pt-BR')}`)
                .moveDown()
                .text(`Usuário: ${response[0]?.name}`)
                .text(`E-mail: ${response[0].email}`)
                .moveDown()
                .moveDown()
                .fontSize(18)
                .text('Resultado da Análise', { align: 'center' })
                .fontSize(12)
                .moveDown()
                .text('Os resultados a seguir são fruto de um modelo probabilístico, com o objetivo de auxiliar na triagem de imagens e vídeos. Portanto, podem ocorrer falsos positivos ou falsos negativos. Necessário executar a verificação visual.')
                .moveDown();

            let start = 480;
            for (const data of response) {
                doc
                    .moveDown()
                    .rect(doc.x - 10, doc.y - 5, 500, 17).fill(this.getColorByClassification(data.classification)).fill('black');

                if (data.type == "image") {
                    doc
                        .text(`ID: ${data.id}`)
                        .text(`ARQUIVO: ${data.file}`)
                        .text(`TIPO: ${data.type}`)
                        .text(`HASH: ${data.hash}`)
                        .text(`NSFW: ${data.nsfw}`)
                        .text(`Nº FACES: ${data.faces}`)
                        .text(`IDADES: ${data.ages}`)
                        .text(`Nº CRIANÇAS: ${data.children}`)
                        .text(`CLASSIFICAÇÃO: ${data.classification}`)
                        .moveDown()
                } else {
                    doc
                        .text(`ID: ${data.id}`)
                        .text(`ARQUIVO: ${data.file}`)
                        .text(`TIPO: ${data.type}`)
                        .text(`HASH: ${data.hash}`)
                        .text(`TIMESTAMP: ${data.timestamp}`)
                        .text(`THUMBNAIL: ${data.thumbnail}`)
                        .text(`CLASSIFICAÇÃO: ${data.classification}`)
                        .moveDown()
                }

                start += 150;

            }

            doc.end();


        } catch (err) {
            res.status(400).json(err);
        }
    }
}