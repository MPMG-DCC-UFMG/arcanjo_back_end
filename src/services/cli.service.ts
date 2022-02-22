import { exec } from 'child_process';
import { AnalysisService } from './analysis.service';

const accents = require('remove-accents');
const resultsDir = process.env.RESULTS_DIR || "/m08/results";
const cliDir = process.env.CLI_DIR;

export class CliService {

    DOCKER_COMMAND: string[] = ["docker", "run", "--rm", "-v", "\"{PATH}:/m08/storage\"", "-v", __dirname + "../../results:/m08/results", "arcanjo-cli", "bash", "-c", "\"python3 run.py -p /m08/storage -i {ID} -t {TYPE} -o /m08/results\""];
    CLI_COMMAND: string[] = ["cd /m08/ &&", "python3", `${cliDir}run.py`, 
        "-p", "{PATH}", 
        "-i", "{ID}", 
        "-t", "{TYPE}", 
        "--age", "{AGE}", 
        "--face", "{FACE}", 
        "--child", "{CHILD}", 
        "--nsfw", "{NSFW}", 
        "--user", "\"{USER}\"", 
        "-o", resultsDir
    ];

    constructor(
        private analysisService = new AnalysisService()
    ) { }

    private getCommand(): string[] {
        return cliDir ? this.CLI_COMMAND : this.DOCKER_COMMAND;
    }

    async processAnalysis(id: number | string, user: string = "") {
        const dirPrefix = process.env.DIR_PREFIX || "";
        const analysis = await this.analysisService.getById(id);

        if (analysis && analysis.status === "created") {
            const finalPath: string = (dirPrefix + analysis.path).replace("//", "/");

            const command: string[] = this.getCommand().map(c => c
                .replace("{PATH}", finalPath)
                .replace("{ID}", `ID_${analysis.id}`)
                .replace("{FACE}", analysis.face_threshold.toString())
                .replace("{CHILD}", analysis.child_threshold.toString())
                .replace("{AGE}", analysis.age_threshold.toString())
                .replace("{NSFW}", analysis.porn_threshold.toString())
                .replace("{TYPE}", this.getType(analysis))
                .replace("{USER}", accents.remove(user))
            );

            this.changeAnalysisStatus(id, "processing")
            this.runCommand(command, (log: string) => this.saveAnalysisLog(id, log), () => this.changeAnalysisStatus(id, "completed"));
        }
    }

    getType(analysis: AnalysisInterface): "imagens" | "videos" | "todos" {
        if (analysis.image && analysis.video) {
            return "todos";
        } else if (analysis.video) {
            return "videos";
        } else {
            return "imagens";
        }
    }

    changeAnalysisStatus(id: number | string, status: string) {
        this.analysisService.update(id, { status })
    }

    saveAnalysisLog(id: number | string, log: string) {
        this.analysisService.update(id, { log })
    }

    runCommand(command: string[], updateLog?: (log: string) => void, finishCallback?: () => void) {
        console.log(`Running command: ${command.join(" ")}`);
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