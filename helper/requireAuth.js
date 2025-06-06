export function requireAuth(context, roles) {
    if (!context.auth) {
        throw new Error('No autorizado: token requerido');
    }

    // en caso de que roles sea undefined, permitimos el acceso pero se verifica el token
    if (!roles) {
        return context.auth;
    }

    // Convertimos roles a array si es un string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(context.auth.role)) {
        throw new Error('No autorizado: permisos insuficientes');
    }

    return context.auth;
}
