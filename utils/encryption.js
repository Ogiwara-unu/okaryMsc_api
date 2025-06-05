import bcrypt from "bcrypt";

export async function encryptPassword (password){
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

export function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}