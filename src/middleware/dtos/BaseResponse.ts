import { Response } from "express";

export class BaseResponse {
    data: any;
    message: string;
    success: boolean;
    statusCode: number;

    constructor(data: any, message: string, success: boolean, statusCode:number) {
        this.data = data;
        this.message = message;
        this.success = success;
        this.statusCode = statusCode;
    }

    apply(res: Response) {
        return res.status(this.statusCode).send(this);
    } 
}