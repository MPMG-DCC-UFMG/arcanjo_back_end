import { spawn, exec } from 'child_process';
import slugify from 'slugify';
import { AnalysisService } from './analysis.service';

export class CliService {

    DOCKER_COMMAND: string[] = ["docker", "run", "-v", "\"{PATH}:/m08/storage\"", "-v", __dirname + "../../results:/m08/results", "arcanjo-cli", "bash", "-c", "\"python3 run.py -p /m08/storage -i {ID} -t imagens -o /m08/results\""];

    constructor(
        private analysisService = new AnalysisService()
    ) { }

    async processAnalysis(id: number | string) {
        const analysis = await this.analysisService.getById(id);
        if (analysis && analysis.status === "created") {
            const command: string[] = this.DOCKER_COMMAND.map(c => c
                .replace("{PATH}", analysis.path)
                .replace("{ID}", `ID_${analysis.id}`)
            );

            this.changeAnalysisStatus(id, "processing")
            this.runCommand(command, (log: string) => this.saveAnalysisLog(id, log), () => this.changeAnalysisStatus(id, "completed"));
        }
    }

    changeAnalysisStatus(id: number | string, status: string) {
        this.analysisService.update(id, { status })
    }

    saveAnalysisLog(id: number | string, log: string) {
        this.analysisService.update(id, { log })
    }

    runCommand(command: string[], updateLog?: (log: string) => void, finishCallback?: () => void) {
        // const execution = spawn(command[0], command.slice(1));
        const execution = exec(command.join(" "));

        execution.stdout?.on("data", data => {
            console.log(`stdout: ${data}`);
            if (updateLog) updateLog(data);
        });

        execution.on('exit', function () {
            if (finishCallback) finishCallback();
        })
    }
}