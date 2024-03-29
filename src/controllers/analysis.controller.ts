import { Request, Response } from 'express';
import _ from 'lodash';
import { AnalysisService } from '../services/analysis.service';
import { UserService } from '../services/user.service';

const fs = require('fs');
const PDFDocument = require('pdfkit');


export class AnalysisController {

    CLASSIFICATION_COLORS = {
        NONE: "#F1F4F9",
        CHILD: "#DBEAFE",
        PORN: "#FFEDD5",
        CHILD_PORN: "#F1F4F9"
    }

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
            const data = await this.analysisService.getById(req.params.id);
            if (data)
                res.json(data);
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

    async cancelProcess(req: Request, res: Response) {
        try {
            const pid = this.analysisService.cancelProcess(req.params.id);
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
        let response = this.analysisService.filteredReport(req.params.id, req.body.ids ? req.body.ids.toString().split(",") : [], true);
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
        if (classification.indexOf("não") >= 0)
            return this.CLASSIFICATION_COLORS.NONE;
        if (
            classification.indexOf("pornografia") >= 0
            && classification.indexOf("menores de idade") >= 0
        )
            return this.CLASSIFICATION_COLORS.CHILD_PORN;
        if (classification.indexOf("pornografia") >= 0)
            return this.CLASSIFICATION_COLORS.PORN;
        if (classification.indexOf("menores de idade") >= 0)
            return this.CLASSIFICATION_COLORS.CHILD;
        return this.CLASSIFICATION_COLORS.NONE;
    }

    addBoldText(doc: any, title: string, description: string | number | undefined) {
        doc
            .font('Helvetica-Bold')
            .text(title, { continued: true })
            .font('Helvetica')
            .text(description === "" ? "--" : description)

        return doc;
    }

    getClassificationText(classification: string): string {
        if (!classification || classification == "['']") {
            return "Pode não conter menores de idade ou pornografia";
        } else {
            return classification;
        }
    }

    fixAges(ages: string): string {
        return ages.replace(/["'\]\[]/g, "");
    }

    fixType(type: string): string {
        switch (type) {
            case "image": return "Imagem";
            case "video": return "Vídeo";
            default: return type;
        }
    }

    getStatistic(id: number, response: any[]) {
        const statistics: (string | number)[][] = [];

        const txt = this.analysisService.getFromResults(id, "estatisticas.txt");
        if (txt) {
            const vars: any = txt.split("\n").reduce((acc, t) => {
                const v = t.split("=");
                return {
                    ...acc,
                    [v[0]]: v[1]
                };
            }, {})

            statistics.push([`Total de registros: `, vars.total_arquivos]);
            statistics.push([`Total de registros processados: `, vars.total_arquivos_processados]);

            statistics.push([`Total de imagens: `, vars.total_arquivos_imagem]);
            statistics.push([`Total de imagens únicas processadas: `, vars.total_arquivos_unicos_imagem]);
            statistics.push([`Total de imagens replicadas: `, vars.total_arquivos_replicados_imagem]);

            statistics.push([`Total de vídeos: `, vars.total_arquivos_video]);
            statistics.push([`Total de vídeos únicos processados: `, vars.total_arquivos_unicos_video]);
            statistics.push([`Total de vídeos replicados: `, vars.total_arquivos_replicados_video]);

        } else {
            const imageCount = response.filter(d => d.type === "image").length;
            const videoCount = _.uniqBy(response.filter(d => d.type === "video"), 'hash').length;

            statistics.push([`Total de registros processados: `, (imageCount + videoCount)]);
            statistics.push([`Total de imagens processadas: `, imageCount]);
            statistics.push([`Total de vídeos processados: `, videoCount]);
        }

        return statistics;
    }

    getDuplicated(id: number | null | undefined): any[] {
        const duplicated = this.analysisService.getFromResults(id || 0, "arquivos_replicados.csv");
        if (!duplicated) return [];

        const vars: any[] = duplicated.split("\n").slice(1).map((t) => {
            const v = t.split(";");
            return {
                type: v[0],
                hash: v[1],
                files: v[2]
            };
        })

        return vars;
    }

    getFilename(duplicatedList: any[], hash: string, filename: string) {
        const item = duplicatedList.find((item: any) => item.hash === hash);
        if (item) {
            return item.files;
        } else {
            return `"${filename}"`;
        }
    }

    async exportPdf(req: Request, res: any) {
        try {
            const { response, report } = await this.getReportData(req, res);
            if (!response) return;
            res.contentType("application/pdf");
            res.header("Content-Disposition", `inline; filename="Relatório ${report?.name}.pdf`);

            const doc = new PDFDocument({ bufferPages: true });

            doc.image('./assets/logo_mpmg.jpg', 220, 30, { width: 150 })

            doc
                .font('Helvetica')
                .moveDown()
                .moveDown()
                .moveDown()
                .fontSize(18)
                .text('Relatório Automático', { align: 'center' })
                .moveDown()
                .fontSize(12)

            this.addBoldText(doc, 'Software: ', 'Arcanjo - Sistema para identificação de pedofilia em imagens e vídeos')

            this.addBoldText(doc, `Versão: `, process.env.VERSION_DATE)

                .moveDown()
                .moveDown()

            this.addBoldText(doc, `Código identificador da análise: `, report?.id)

            const statistics = this.getStatistic(report?.id || 0, response);
            for (const statistic of statistics) {
                this.addBoldText(doc, statistic[0].toString(), statistic[1]);
            }

            this.addBoldText(doc, `Data e hora: `, report?.createdAt.toLocaleString('pt-BR'))

                .moveDown()

            this.addBoldText(doc, `Usuário: `, response[0].name)

            this.addBoldText(doc, `E-mail: `, response[0].email)

                .moveDown()
                .moveDown()
                .fontSize(18)
                .text('Resultado da Análise', { align: 'center' })
                .fontSize(12)
                .moveDown()
                .text('Os resultados a seguir são fruto de um modelo probabilístico, com o objetivo de auxiliar na triagem de imagens e vídeos. Portanto, podem ocorrer falsos positivos ou falsos negativos. Necessário executar a verificação visual.')
                .moveDown();

            const duplicated = this.getDuplicated(report?.id);

            for (const data of response) {
                doc
                    .moveDown()
                    .rect(doc.x - 10, doc.y - 5, 500, 17).fill(this.getColorByClassification(data.classification)).fill('black');

                if (data.type == "image") {

                    this.addBoldText(doc, `ID: `, data.id)
                    this.addBoldText(doc, `Arquivo: `, this.getFilename(duplicated, data.hash, data.file))
                    this.addBoldText(doc, `Tipo: `, this.fixType(data.type))
                    this.addBoldText(doc, `Hash: `, data.hash)
                    this.addBoldText(doc, `NSFW: `, data.nsfw)
                    this.addBoldText(doc, `Nº Faces: `, data.faces)
                    this.addBoldText(doc, `Idades: `, this.fixAges(data.ages))
                    this.addBoldText(doc, `Nº Crianças: `, data.children)
                    this.addBoldText(doc, `Classificação: `, this.getClassificationText(data.classification))
                        .moveDown()
                } else {
                    doc
                    this.addBoldText(doc, `ID: `, data.id)
                    this.addBoldText(doc, `Arquivo: `, this.getFilename(duplicated, data.hash, data.file))
                    this.addBoldText(doc, `Tipo: `, this.fixType(data.type))
                    this.addBoldText(doc, `Hash: `, data.hash)
                    this.addBoldText(doc, `Timestamp: `, data.timestamp)
                    this.addBoldText(doc, `Thumbnail: `, data.thumbnail)
                    this.addBoldText(doc, `Classificação: `, this.getClassificationText(data.classification))
                        .moveDown()
                }

            }

            // see the range of buffered pages
            const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }
            const start = range.start;
            const end = range.start + range.count;
            const now = new Date().toLocaleString('pt-BR');
            for (let i = start; i < end; i++) {
                doc.switchToPage(i)
                const originalMargin = doc.page.margins;
                doc.page.margins = {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                };
                doc.text(`Página ${i + 1} de ${range.count}`, 475, 750);
                doc.text(`Arcanjo - ${now}`, originalMargin.left, 750);
            }

            // // manually flush pages that have been buffered
            doc.flushPages();

            doc.end();
            doc.pipe(res);


        } catch (err) {
            res.status(400).json(err);
        }
    }
}