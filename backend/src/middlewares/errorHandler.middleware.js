const errorHandler = (err, req, res, next) => {
    console.log(err.stack);
    res.status(400)
        .json({
            status: 400,
            message: `Something Went Wrong! ${err.message}`,
            error: err.stack
        });
}

export default errorHandler;