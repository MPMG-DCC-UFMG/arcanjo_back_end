import { exec } from 'child_process';
import { AnalysisService } from './analysis.service';
import * as path from 'path'

const accents = require('remove-accents');
const resultsDir = process.env.RESULTS_DIR || "/m08/results";
const cliDir = process.env.CLI_DIR;

export class CliService {

    DOCKER_COMMAND: string[] = ["docker", "run", "--rm",
        "-v", "\"C:{PATH}:/m08/storage\"",
        "-v", path.resolve(__dirname + "../../../logs") + ":/m08/M08/log",
        "-v", path.resolve(__dirname + "../../../results") + ":/m08/results",
        "arcanjo-cli",
        "bash", "-c",
        "\"mkdir '/m08/M08/log/{ID}';",
        "mkdir '/m08/results/{ID}';",
        "cd /m08/;",
        "python3 run.py -p /m08/storage -i {ID} -t {TYPE} --age {AGE} --face {FACE} --child {CHILD} --nsfw {NSFW} --user '{USER}' -o /m08/results",
        "1> '/m08/M08/log/{ID}/log_stdout.txt'",
        "2> '/m08/M08/log/{ID}/log_stderr.txt'",
        "\""
    ];
    CLI_COMMAND: string[] = ["cd /m08/ &&",
        "mkdir \"/m08/M08/log/{ID}\";",
        "mkdir \"/m08/results/{ID}\";",
        "python3", `${cliDir}run.py`,
        "-p", "\"{PATH}\"",
        "-i", "{ID}",
        "-t", "{TYPE}",
        "--age", "{AGE}",
        "--face", "{FACE}",
        "--child", "{CHILD}",
        "--nsfw", "{NSFW}",
        "--user", "\"{USER}\"",
        "-o", resultsDir,
        "1> \"/m08/M08/log/{ID}/log_stdout.txt\"",
        "2> \"/m08/M08/log/{ID}/log_stderr.txt\"",
        "&"
    ];

    constructor(
        private analysisService = new AnalysisService()
    ) {
        console.log(path.resolve(__dirname + "../../../results"));
    }

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
            this.runCommand(command,
                (log: string) => this.saveAnalysisLog(id, log),
                undefined, //() => this.changeAnalysisStatus(id, "completed"),
                () => this.changeAnalysisStatus(id, "error"),
            );
        }
    }

    async cancelProcess(id: number | string, pid: string) {
        const command: string[] = [
            "kill", "-9", pid
        ];
        this.runCommand(command);
        this.changeAnalysisStatus(id, "canceled")
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

    runCommand(command: string[], updateLog?: (log: string) => void, finishCallback?: () => void, errorCallback?: () => void) {
        console.log(`Running command: ${command.join(" ")}`);
        const execution = exec(command.join(" "));

        execution.stdout?.on("data", data => {
            console.log(`stdout: ${data}`);
            if (updateLog) updateLog(data);
        });

        execution.on('close', function (code) {
            if (code === 0) {
                if (finishCallback) finishCallback();
            } else {
                // if(errorCallback) errorCallback();
            }
        })

        execution.on('error', function (error) {
            console.log(`error: ${error.message}`);
        })

        execution.on('exit', function () {
            console.log(`Execution exited`)
        })
    }
}