'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";
import { isAdminEmail } from "@/lib/admin";
import { connectToDatabase } from "@/database/mongoose";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            // Persist the extra onboarding fields on the user document
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if (db) {
                await db.collection('user').updateOne(
                    { email: email.trim().toLowerCase() },
                    { $set: { country, investmentGoals, riskTolerance, preferredIndustry } }
                );
            }

            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        // If the fixed admin credentials are used and the admin user doesn't exist yet,
        // create it on-demand to keep local/dev setup frictionless.
        if (isAdminEmail(email)) {
            try {
                const response = await auth.api.signUpEmail({
                    body: { email, password, name: "Admin" },
                });
                // Optional: ensure the admin user has some defaults to keep admin rows consistent
                const mongoose = await connectToDatabase();
                const db = mongoose.connection.db;
                if (db) {
                    await db.collection('user').updateOne(
                        { email: email.trim().toLowerCase() },
                        { $set: { country: 'US', investmentGoals: 'Growth', riskTolerance: 'Medium', preferredIndustry: 'Technology' } }
                    );
                }
                return { success: true, data: response }
            } catch (createErr) {
                console.log('Admin bootstrap failed', createErr)
            }
        }

        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

export const requestPasswordReset = async (email: string) => {
    try {
        const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectTo = `${baseUrl}/reset-password`;
        await auth.api.requestPasswordReset({
            body: { email: email.trim().toLowerCase(), redirectTo },
        });
        return { success: true };
    } catch (e) {
        console.log('Request password reset failed', e);
        return { success: false, error: 'Failed to send reset email. Please check the email address.' };
    }
}

export const resetPassword = async (newPassword: string, token: string) => {
    try {
        await auth.api.resetPassword({
            body: { newPassword: newPassword.trim(), token },
        });
        return { success: true };
    } catch (e) {
        console.log('Reset password failed', e);
        return { success: false, error: e instanceof Error ? e.message : 'Failed to reset password. The link may have expired.' };
    }
}
