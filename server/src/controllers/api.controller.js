import responseMessage from '../constant/responseMessage.js';
import httpError from '../utils/httpError.js';
import httpResponse from '../utils/httpResponse.js';


export default {
    self: (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },
}