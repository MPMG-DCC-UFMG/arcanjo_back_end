import jwt from "jsonwebtoken";

export class AuthService {

    constructor() { }

    static getSecret(): string {
        return process.env.JWT_SECRET || "secret";
    }

    static generateToken(data: UserInterface): string {
        const token = jwt.sign(JSON.stringify(data), this.getSecret());
        return token;
    }

    static validateToken(token: string): boolean {
        try {
            jwt.verify(token, this.getSecret());
            return true;
        } catch {
            return false;
        }
    }

    static decodeToken(token: string): UserInterface {
        if (this.validateToken(token)) {
            const payload = jwt.decode(token);
            return payload as UserInterface;
        } else {
            throw "Token inválido";
        }
    }

}