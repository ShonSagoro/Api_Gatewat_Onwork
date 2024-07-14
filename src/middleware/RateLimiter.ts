import rateLimit from 'express-rate-limit';
import { BaseResponse } from './dtos/BaseResponse';

export const rateLimiter = rateLimit({
    windowMs: 1000,
    max: 10,
    headers: true,
    handler: (req, res) => {
        const baseResponse = new BaseResponse(null, 'Too many requests from this IP, please try again after 5 seconds.', false, 429);
        baseResponse.apply(res);
    },
    standardHeaders: true,
    legacyHeaders: false 
});
