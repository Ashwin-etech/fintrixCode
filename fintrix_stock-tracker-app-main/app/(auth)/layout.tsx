import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user) redirect('/');

    // Check if current page is sign-up by checking the URL
    const headersList = await headers();
    const url = headersList.get('x-url') || '';
    const isSignUpPage = url.includes('/sign-up');

    return (
        <main className="auth-layout">
            {/* Form Section - Always visible */}
            <section className="auth-left-section">
                <Link href="/" className="auth-logo">
                    <Image src="/assets/icons/logo.svg" alt="Signalist logo" width={140} height={32} className='h-8 w-auto' />
                </Link>
                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>

            {/* Branding Section - Hidden on mobile for sign-up, visible for sign-in */}
            <section className={`auth-right-section ${isSignUpPage ? 'signup-mobile-hidden' : ''} relative flex flex-col justify-center items-center overflow-y-auto`}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/10" />

                <div className="relative flex flex-col w-full items-center justify-center flex-1 gap-12 py-16 px-4 md:px-10 lg:px-16">
                    <div className="max-w-2xl text-center space-y-4">
                        <p className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1 text-xs font-medium tracking-wide uppercase text-yellow-300">
                            Virtual trading platform for learners
                        </p>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                            Learn Trading the <span className="bg-gradient-to-r from-yellow-400 to-amber-200 bg-clip-text text-transparent">Smart Way</span>
                        </h1>
                        <p className="text-gray-300 max-w-xl mx-auto text-base md:text-lg">
                            Built by students who got tired of expensive, bloated trading simulators. Practice with virtual money,
                            master real strategies, and learn — no ads, no paywalls.
                        </p>
                    </div>

                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <Card className="h-full">
                            <CardHeader className="flex flex-row items-center gap-3 pb-3">
                                <div className="bg-emerald-500/15 flex items-center justify-center rounded-full w-10 h-10">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                    </svg>
                                </div>
                                <CardTitle>3,000+ Assets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Trade stocks, ETFs, mutual funds, and crypto. More assets than most paid platforms — completely free.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card className="h-full">
                            <CardHeader className="flex flex-row items-center gap-3 pb-3">
                                <div className="bg-purple-500/15 flex items-center justify-center rounded-full w-10 h-10">
                                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                </div>
                                <CardTitle>Built for Anyone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Perfect for students and young adults. Learn by doing, not by reading 30 Investopedia articles.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="w-full max-w-4xl grid grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border-gray-800/80">
                            <CardHeader className="items-center pb-2">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Assets Available</p>
                                <p className="text-3xl md:text-4xl font-bold text-gray-50">3K+</p>
                            </CardHeader>
                        </Card>
                        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border-gray-800/80">
                            <CardHeader className="items-center pb-2">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Free &amp; Open Source</p>
                                <p className="text-3xl md:text-4xl font-bold text-gray-50">100%</p>
                            </CardHeader>
                        </Card>
                        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border-gray-800/80">
                            <CardHeader className="items-center pb-2">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Paywalls</p>
                                <p className="text-3xl md:text-4xl font-bold text-gray-50">$0</p>
                            </CardHeader>
                        </Card>
                    </div>
                </div>

                <div className="relative w-full flex flex-col items-center my-20 px-4 md:px-10 lg:px-16">
                    <div className="max-w-3xl text-center mb-10 space-y-4">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                            Why we Built This
                        </h2>
                        <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg">
                            As a team of computer science students, we were frustrated with trading platforms that were complex,
                            hidden behind account walls, and not beginner-friendly. So we built Fintrix to provide a simpler and
                            more accessible learning experience.
                        </p>
                    </div>

                    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3 pb-3">
                                <div className="bg-purple-500/20 rounded-full w-10 h-10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                    </svg>
                                </div>
                                <CardTitle>Educational Focus</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Built-in explanations, learning aids help you understand strategies, not just click buttons.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3 pb-3">
                                <div className="bg-yellow-500/20 rounded-full w-10 h-10 flex items-center justify-center">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-yellow-300"
                                    >
                                        <path
                                            d="M4 5H20V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V5Z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M9 21H15"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M9 9L11 11L15 7"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <CardTitle>Simulated Trades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Safely practice buying, selling, and tracking stocks — risk free and with real market data.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </main>
    )
}
export default Layout
