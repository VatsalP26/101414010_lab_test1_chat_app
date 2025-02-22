const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Expecting token in the "Authorization" header (raw token, not "Bearer <token>")
    const token = req.header("Authorization");

    if (!token)
        return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to the request
        next();
    } catch (err) {
        res.status(400).json({ msg: "Token is not valid" });
    }
};

module.exports = verifyToken;
