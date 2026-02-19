import { Link } from "react-router-dom";

const Footer = () => (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

                {/* Brand */}
                <div>
                    <h3 className="text-white font-bold text-lg mb-2">💊 MedStore</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        A technology intermediary connecting patients with licensed pharmacies.
                        Not a pharmacy. Medicines dispensed only against valid prescriptions.
                    </p>
                    <p className="text-xs text-gray-500 mt-3">
                        Licensed under Drugs and Cosmetics Act, 1940
                    </p>
                </div>

                {/* Legal Links */}
                <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/disclaimer" className="hover:text-white transition-colors">Medical Disclaimer</Link></li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Support</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/support" className="hover:text-white transition-colors">Contact Support</Link></li>
                        <li>
                            <a href="mailto:support@medstore.in" className="hover:text-white transition-colors">
                                support@medstore.in
                            </a>
                        </li>
                        <li className="text-gray-500">
                            🚨 Emergency: <a href="tel:112" className="text-red-400 font-bold hover:text-red-300">112</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                <p>© 2026 MedStore. All rights reserved.</p>
                <p>Governed by Indian Law · IT Act 2000 · DPDP Act 2023</p>
            </div>
        </div>
    </footer>
);

export default Footer;
