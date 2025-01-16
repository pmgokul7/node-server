import errorlist from './errors.json' assert { type: 'json'}


class CustomError extends Error{
    constructor(code){
        const errors = errorlist[0] 
        const {error ,code:statusCode} = errors[code] || {};
        super(error || 'Unknown error');
        this.code = code;
        this.statusCode = statusCode || 500;
    }
}

export const throwCustomError = (code) => {
    throw new CustomError(code);
};