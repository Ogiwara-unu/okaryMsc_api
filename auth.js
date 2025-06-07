import { expressjwt } from "express-jwt"
import jwt from "jsonwebtoken"
import { getUserByEmail } from "./services/user.js"
import { comparePassword } from "./utils/encryption.js"

const secret = Buffer.from('fundamentosweb', 'base64')

export const authMiddleware = expressjwt({
    algorithms: ['HS256'],
    credentialsRequired: false,
    secret,
})

export async function getToken(req, res) {
    const { email, password } = req.body
    const user = await getUserByEmail(email)
    if (!user || !(await comparePassword(password, user.password))) {
        res.sendStatus(401)
    } else {
        const claims = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        }
        const token = jwt.sign(claims, secret, { expiresIn: '2h' });
        
        // Devolver tanto el token como la info del usuario
        res.json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    }
}

export async function decodeToken(token) {
    try {
        return jwt.verify(token, secret)
    } catch (err) {
        console.log("Error:", err)
        return null
    }
}