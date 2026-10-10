export const sendSuccess = (res, { status = 200, message, data, meta }) =>
  res.status(status).json({ success: true, message, ...(data && { data }), ...(meta && { meta }) });
