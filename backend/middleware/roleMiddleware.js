const requireRole = (role) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        // Define hierarchy: admin > professor > student
        if (role === 'professor' && userRole === 'admin') {
            return next();
        }

        if (!userRole || userRole !== role) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = requireRole;
