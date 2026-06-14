export function errorHandler(err, req, res, next) {
  console.error(err);

  // Handle body-parser payload too large errors (413)
  if (err.type === "entity.too.large" || err.message?.includes("PayloadTooLargeError")) {
    return res.status(413).json({ message: "Payload too large", error: err.message });
  }

  // Default to 500
  res.status(500).json({ message: "Internal server error", error: err.message });
}
