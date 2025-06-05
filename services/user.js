import { connection } from "./dbConnection.js";
const usertb = () => connection.table('users');

// Obtener un usuario por ID
export async function getUser(id) {
  return await usertb().first().where({ id });
}

// Obtener un usuario por correo electrónico
export async function getUserByEmail(email) {
  return await usertb().first().where({ email });
}

// Obtener todos los usuarios (opcionalmente limitados)
export async function getUsers(limit) {
  const query = usertb().select().orderBy('username', 'asc');
  if (limit) {
    query.limit(limit);
  }
  return query;
}

// Crear un nuevo usuario
export async function addUser({ username, email, password, role = 'user' }) {
  const user = {
    username,
    email,
    password,
    role
  };
  
  // Verificar si el usuario ya existe
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('El usuario ya existe');
  }

  // Solo insertamos UNA vez
  const [id] = await usertb().insert(user);

  // Obtener el usuario recién creado
  const newUser = await getUser(id);
  return newUser;
}


// Actualizar un usuario existente
export async function updateUser(id, { username, email, role }) {
  const user = await getUser(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  const updatedUser = {
    ...user,
    username,
    email,
    role
  };
  await usertb().where({ id }).update(updatedUser);
  return updatedUser;
}

// Eliminar un usuario por ID
export async function deleteUser(id) {
  const user = await getUser(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  await usertb().where({ id }).del();
  return user;
}
