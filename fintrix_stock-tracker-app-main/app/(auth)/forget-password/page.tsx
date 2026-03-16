'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { requestPasswordReset } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';

type ForgetPasswordFormData = { email: string };

const ForgetPassword = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgetPasswordFormData>({
        defaultValues: { email: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ForgetPasswordFormData) => {
        const result = await requestPasswordReset(data.email);
        if (result.success) {
            toast.success('Check your email', {
                description: 'If an account exists, we sent a password reset link.',
            });
        } else {
            toast.error('Request failed', { description: result.error });
        }
    };

    return (
        <>
            <h1 className="form-title">Forgot password</h1>
            <p className="text-gray-400 text-sm mb-5">
                Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="you@example.com"
                    type="email"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                    }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Sending...' : 'Send reset link'}
                </Button>

                <FooterLink text="Remember your password?" linkText="Back to sign in" href="/sign-in" />
            </form>
        </>
    );
};

export default ForgetPassword;
