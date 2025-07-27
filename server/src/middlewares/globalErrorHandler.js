export default (err, _, res, __) => {
    res.status(err.statusCode || 500).json(err);
};
