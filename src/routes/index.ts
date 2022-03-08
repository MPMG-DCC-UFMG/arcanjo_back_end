import { Request, Response } from 'express';
import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { AuthController } from '../controllers/auth.controller';
import { DirectorySelectorController } from '../controllers/directorySelect.controller';
import { StorageController } from '../controllers/storage.controller';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export default class MainRouter {

    router: Router;

    constructor(private authMiddleware = new AuthMiddleware()) {
        this.router = Router({ mergeParams: true });

        this.authRoutes();
        this.userRegisterRoutes();
        this.storageRoutes();

        this.router.use(authMiddleware.validateToken);

        this.userRoutes();
        this.analysisRoutes();
        this.dirSelectRoutes();
    }

    private authRoutes() {
        const authController = new AuthController();

        this.router.route('/login')
            .post((req: Request, res: Response) => authController.login(req, res));

    }

    private storageRoutes() {
        const storageController = new StorageController();
        const analysisController = new AnalysisController();

        this.router.route('/storage')
            .get((req: Request, res: Response) => storageController.getFile(req, res));

        this.router.route('/storage/report/:id')
            .get((req: Request, res: Response) => storageController.getReport(req, res));


        this.router.route('/analysis/:id/report/download')
            .get((req: Request, res: Response) => analysisController.exportReport(req, res))

    }

    private dirSelectRoutes() {
        const dirController = new DirectorySelectorController();

        this.router.route('/dir')
            .get((req: Request, res: Response) => dirController.getDir(req, res));

        this.router.route('/dir/fileTypes')
            .get((req: Request, res: Response) => dirController.fileTypeAvailability(req, res));

    }

    private userRegisterRoutes() {
        const userController = new UserController();

        this.router.route('/users')
            .post((req: Request, res: Response) => userController.create(req, res));
    }

    private userRoutes() {
        const userController = new UserController();

        this.router.route('/users')
            .get((req: Request, res: Response) => userController.readAll(req, res));

        this.router.route('/users/:id')
            .get((req: Request, res: Response) => userController.read(req, res))
            .put((req: Request, res: Response) => userController.update(req, res))
            .delete((req: Request, res: Response) => userController.delete(req, res));
    }

    private analysisRoutes() {
        const analysisController = new AnalysisController();

        this.router.route('/analysis')
            .get((req: Request, res: Response) => analysisController.readAll(req, res))
            .post((req: Request, res: Response) => analysisController.create(req, res));

        this.router.route('/analysis/:id')
            .get((req: Request, res: Response) => analysisController.read(req, res))
            .put((req: Request, res: Response) => analysisController.update(req, res))
            .delete((req: Request, res: Response) => analysisController.delete(req, res));

        this.router.route('/analysis/:id/process')
            .post((req: Request, res: Response) => analysisController.process(req, res))

        this.router.route('/analysis/:id/report')
            .get((req: Request, res: Response) => analysisController.report(req, res))

    }


}