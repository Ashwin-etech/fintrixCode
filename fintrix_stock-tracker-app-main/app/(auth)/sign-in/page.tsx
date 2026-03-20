'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { Activity } from "lucide-react";

const SignIn = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await signInWithEmail(data);
            if (result.success) router.push(isAdminEmail(data.email) ? '/admin' : '/');
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Failed to sign in');
            toast.error('Sign in failed', {
                description: e instanceof Error ? e.message : 'Failed to sign in.'
            })
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400" />
                    <p className="text-gray-300">Signing in...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
                <div className="text-center max-w-md">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-100">Sign In Error</h3>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <h1 className="form-title">Welcome back</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@fintrix.com"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
                />

                <div className="space-y-2">
                    <InputField
                        name="password"
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                        register={register}
                        error={errors.password}
                        validation={{ required: 'Password is required', minLength: 4 }}
                    />
                    <div className="flex justify-end">
                        <Link href="/forget-password" className="text-sm text-yellow-400 hover:text-yellow-300 font-medium">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting || isLoading} className="yellow-btn w-full mt-5">
                    {isSubmitting || isLoading ? (
                        <>
                            <Activity className="h-4 w-4 animate-spin mr-2" />
                            Signing In...
                        </>
                    ) : 'Sign In'}
                </Button>

                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
            </form>
        </>
    );
};
export default SignIn;
