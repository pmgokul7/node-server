export const sendSuccess = async (req, res, message, code = 200, data = null) => {
    try {
        res.status(code).json({
             status: 'success',
             message: message,
             data: data,
         });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
         });
    }
}

export const sendError = async (req, res, error) => {
    try {
        res.status(error.statusCode || 400).json({
            status: 'error',
            message: error.message || 'Operation failed',
            code: error.code || 400,
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        })
    }
}

