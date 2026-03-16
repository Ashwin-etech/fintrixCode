'use client';

import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { resetPassword } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';
import Link from 'next/link';

type ResetPasswordFormData = { newPassword: string; confirmPassword: string };

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || searchParams.get('error');
    const [tokenError, setTokenError] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get('error') === 'INVALID_TOKEN') {
            setTokenError('This reset link is invalid or has expired. Please request a new one.');
        }
    }, [searchParams]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        defaultValues: { newPassword: '', confirmPassword: '' },
        mode: 'onBlur',
    });

    const newPassword = watch('newPassword');

    const onSubmit = async (data: ResetPasswordFormData) => {
        const tokenValue = searchParams.get('token');
        if (!tokenValue) {
            toast.error('Missing token', { description: 'Please use the link from your email.' });
            return;
        }

        const result = await resetPassword(data.newPassword, tokenValue);
        if (result.success) {
            toast.success('Password updated', {
                description: 'You can now sign in with your new password.',
            });
            router.push('/sign-in');
        } else {
            toast.error('Reset failed', { description: result.error });
        }
    };

    if (tokenError) {
        return (
            <>
                <h1 className="form-title">Invalid reset link</h1>
                <p className="text-gray-400 text-sm mb-5">{tokenError}</p>
                <Link
                    href="/forget-password"
                    className="yellow-btn w-full mt-5 inline-block text-center"
                >
                    Request new link
                </Link>
                <FooterLink text="Remember your password?" linkText="Back to sign in" href="/sign-in" />
            </>
        );
    }

    if (!token && !searchParams.get('error')) {
        return (
            <>
                <h1 className="form-title">Reset password</h1>
                <p className="text-gray-400 text-sm mb-5">
                    Use the link from your email to reset your password.
                </p>
                <FooterLink text="Didn&apos;t receive an email?" linkText="Request a new link" href="/forget-password" />
                <FooterLink text="Remember your password?" linkText="Back to sign in" href="/sign-in" />
            </>
        );
    }

    return (
        <>
            <h1 className="form-title">Set new password</h1>
            <p className="text-gray-400 text-sm mb-5">Enter your new password below.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="newPassword"
                    label="New password"
                    placeholder="Enter new password"
                    type="password"
                    register={register}
                    error={errors.newPassword}
                    validation={{
                        required: 'Password is required',
                        minLength: { value: 4, message: 'Password must be at least 4 characters' },
                    }}
                />

                <InputField
                    name="confirmPassword"
                    label="Confirm password"
                    placeholder="Confirm new password"
                    type="password"
                    register={register}
                    error={errors.confirmPassword}
                    validation={{
                        required: 'Please confirm your password',
                        validate: (val) => val === newPassword || 'Passwords do not match',
                    }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Updating...' : 'Update password'}
                </Button>

                <FooterLink text="Remember your password?" linkText="Back to sign in" href="/sign-in" />
            </form>
        </>
    );
};

export default ResetPassword;
