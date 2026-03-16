import { betterAuth } from "better-auth";
import { mongodbAdapter} from "better-auth/adapters/mongodb";
import { connectToDatabase} from "@/database/mongoose";
import { nextCookies} from "better-auth/next-js";
import { transporter } from "@/lib/nodemailer";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if(authInstance) return authInstance;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if(!db) throw new Error('MongoDB connection not found');

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 4,
            maxPasswordLength: 128,
            autoSignIn: true,
            sendResetPassword: async ({ user, url }) => {
                void transporter.sendMail({
                    from: '"Signalist" <signalist@jsmastery.pro>',
                    to: user.email,
                    subject: "Reset your password - Signalist",
                    text: `Click the link to reset your password: ${url}`,
                    html: `
                        <p>Hi ${user.name || 'there'},</p>
                        <p>You requested a password reset. Click the link below to set a new password:</p>
                        <p><a href="${url}" style="color:#eab308;font-weight:600">Reset password</a></p>
                        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
                        <p>— Signalist</p>
                    `,
                });
            },
        },
        plugins: [nextCookies()],
    });

    return authInstance;
}

export const auth = await getAuth();
