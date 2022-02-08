

export class ErrorHandling {

    constructor() { }

    static fixSequelizeErrors(error: any) {
        if (error.errors)
            return {
                message: error.errors.map((e: any) => e.message)
            }
        else
            return error;
    }

}