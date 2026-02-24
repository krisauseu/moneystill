
export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-12 py-8 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1800px] mx-auto">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-800 dark:text-white">moneystill</span>
                    <span>&copy; {currentYear}</span>
                    <span className="h-1 w-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-2 hidden md:block"></span>
                    <span className="hidden md:block">Budget simply, live peacefully.</span>
                </div>

                <div className="flex items-center gap-6 text-sm font-medium">
                    <a
                        href="https://moneystill.com/imprint.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 transition-colors"
                    >
                        Imprint
                    </a>
                    <a
                        href="https://moneystill.com/privacy.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 transition-colors"
                    >
                        Privacy Policy
                    </a>
                    <a
                        href="https://moneystill.com/terms.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 transition-colors"
                    >
                        Terms of Service
                    </a>
                </div>
            </div>
        </footer>
    );
}
