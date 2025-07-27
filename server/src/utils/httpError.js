import errorObject from './errorObject.js';

export default (nextFunc, err, req, errorStatusCode = 500) => {
    const errorObj = errorObject(new Error(err), req, errorStatusCode);
    return nextFunc(errorObj);
};
