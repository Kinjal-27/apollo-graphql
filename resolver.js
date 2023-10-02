import { quotes, users } from "./fakedb.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";

const User = mongoose.model("User");

const resolvers = {
    Query: {
        users: () => users,
        user: (_, { _id }) => users.find(user => user._id == _id),
        quotes: () => quotes,
        iquote: (_, { by }) => quotes.find(quote => quote.by == by)
    },
    User: {
        quotes: (ur) => quotes.filter(quote => quote.by == ur._id)
    },
    Mutation: {
        signUpUser: async (_, { userNew }) => {
            const user = await User.findOne({ email: userNew.email })
            if (user) {
                throw new Error("User already exist with that email")
            }
            const hashedPassword = await bcrypt.hash(userNew.password, 12)

            const newUser = new User({
                ...userNew,
                password: hashedPassword
            })

            return await newUser.save()
        },
        signInUser: async (_, { userSignIn }) => {
            const user = await User.findOne({ email: userSignIn.email })
            if (!user) {
                throw new Error("User dosen't exist with that email")
            }
            const doMatch = await bcrypt.compare(userSignIn.password, user.password)
            if (!doMatch) {
                throw new Error("email or password is invalid")
            }
            const token = Jwt.sign({ userId: user._id }, JWT_SECRET)
            return { token }

        }
    }
}

export default resolvers