import userModel from '../models/user.model.js';



export const createUser = async ({
    email, password, username
}) => {

    if (!email || !password || !username) {
        throw new Error('Username, email and password are required');
    }

    const normalizedUsername = username.trim().toLowerCase();
    const hashedPassword = await userModel.hashPassword(password);

    try {
        const user = await userModel.create({
            username: normalizedUsername,
            email,
            password: hashedPassword
        });

        return user;
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Username already taken');
        }
        throw error;
    }

}

export const getAllUsers = async ({ userId, search = '' }) => {
    const query = {
        _id: { $ne: userId }
    };

    const searchTerm = search?.trim();

    if (searchTerm) {
        query.$or = [
            { username: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const users = await userModel.find(query).sort({ username: 1 });
    return users;
}