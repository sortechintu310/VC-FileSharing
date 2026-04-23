const errorHandler = (err, req, res, next) => {
    console.log(err.stack);

    if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            status: 413,
            message: "Uploaded file is too large",
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }

    const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;

    res.status(status).json({
        status,
        message: err?.message || "Something went wrong",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}

export default errorHandler;
