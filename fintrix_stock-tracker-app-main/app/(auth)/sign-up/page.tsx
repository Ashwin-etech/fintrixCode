'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import { signUpWithEmail, checkUserExists } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity } from "lucide-react";

const SignUp = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        setError: setFormError,
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            country: 'US',
            investmentGoals: 'Growth',
            riskTolerance: 'Medium',
            preferredIndustry: 'Technology'
        },
        mode: 'onBlur'
    },);

    const validateEmail = async (email: string) => {
        if (!email || !/^\w+@\w+\.\w+$/.test(email)) return false;

        setIsCheckingEmail(true);
        try {
            const result = await checkUserExists(email);
            if (result.exists) {
                setFormError('email', {
                    type: 'manual',
                    message: 'An account with this email already exists. Please sign in instead.'
                });
                return false;
            }
        } catch (e) {
            console.error('Email validation failed:', e);
        } finally {
            setIsCheckingEmail(false);
        }
        return true;
    };

    const onSubmit = async (data: SignUpFormData) => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if email already exists before attempting sign up
            const emailValid = await validateEmail(data.email);
            if (!emailValid) {
                setIsLoading(false);
                return;
            }

            const result = await signUpWithEmail(data);
            if (result.success) router.push('/');
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Failed to create an account');
            toast.error('Sign up failed', {
                description: e instanceof Error ? e.message : 'Failed to create an account.'
            })
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Creating your account...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center max-w-md">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2">Sign Up Error</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
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
            <h1 className="form-title">Sign Up & Personalize</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="fullName"
                    label="Full Name"
                    placeholder="your full name or business name"
                    register={register}
                    error={errors.fullName}
                    validation={{ required: 'Full name is required', minLength: 2 }}
                />

                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@fintrix.com"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email name is required',
                        pattern: /^\w+@\w+\.\w+$/,
                        message: 'Email address is required',
                        onBlur: async (e: React.FocusEvent<HTMLInputElement>) => {
                            await validateEmail(e.target.value);
                        }
                    }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter a strong password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <CountrySelectField
                    name="country"
                    label="Country"
                    control={control}
                    error={errors.country}
                    required
                />

                <SelectField
                    name="investmentGoals"
                    label="Investment Goals"
                    placeholder="Select your investment goal"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    placeholder="Select your risk level"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    placeholder="Select your preferred industry"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting || isLoading || isCheckingEmail} className="yellow-btn w-full mt-5">
                    {isSubmitting || isLoading ? (
                        <>
                            <Activity className="h-4 w-4 animate-spin mr-2" />
                            Creating Account...
                        </>
                    ) : isCheckingEmail ? (
                        <>
                            <Activity className="h-4 w-4 animate-spin mr-2" />
                            Checking Email...
                        </>
                    ) : 'Start Your Investing Journey'}
                </Button>

                <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in" />
            </form>
        </>
    )
}
export default SignUp;
