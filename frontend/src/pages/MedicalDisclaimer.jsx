import { Link } from "react-router-dom";

const MedicalDisclaimer = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">

            {/* Emergency Banner */}
            <div className="bg-red-600 text-white rounded-2xl p-5 mb-6 flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">🚨</span>
                <div>
                    <p className="font-bold text-lg">Medical Emergency?</p>
                    <p className="text-red-100 text-sm mt-1">
                        If you or someone around you is experiencing a medical emergency, call{" "}
                        <a href="tel:112" className="font-bold text-white underline text-xl">112</a>{" "}
                        (National Emergency Number) immediately. Do not delay emergency care.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Disclaimer</h1>
                    <p className="text-sm text-gray-400">Please read this carefully before using MedStore</p>
                </div>

                <div className="space-y-6 text-gray-600 leading-relaxed">

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-amber-900 mb-2">⚠️ Not a Medical Provider</h2>
                        <p className="text-amber-800">
                            MedStore is a <strong>technology platform</strong>, not a medical provider, hospital, clinic,
                            or pharmacy. We do not provide medical advice, diagnosis, or treatment of any kind.
                            Nothing on this platform should be construed as medical advice.
                        </p>
                    </div>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Consult a Doctor First</h2>
                        <p>
                            <strong>Always consult a registered medical practitioner (RMP)</strong> before purchasing
                            or consuming any medicine, including over-the-counter (OTC) medicines. A qualified doctor
                            can assess your specific medical condition, history, allergies, and other medications to
                            prescribe the most appropriate treatment.
                        </p>
                        <p className="mt-3">
                            Do not use information found on this platform, product descriptions, or user reviews as
                            a substitute for professional medical advice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Self-Medication is Dangerous</h2>
                        <p>
                            Self-medication — purchasing and consuming prescription medicines without a doctor's
                            consultation — is <strong>dangerous and potentially life-threatening</strong>. Risks include:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>Incorrect dosage leading to toxicity or treatment failure</li>
                            <li>Dangerous drug interactions with other medicines you may be taking</li>
                            <li>Masking symptoms of serious underlying conditions</li>
                            <li>Development of antibiotic resistance</li>
                            <li>Allergic reactions, including anaphylaxis</li>
                        </ul>
                        <p className="mt-3 font-medium text-gray-800">
                            MedStore strictly requires valid prescriptions for all Schedule H, H1, and X medicines
                            and will not dispense them without pharmacist verification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Product Information</h2>
                        <p>
                            Medicine descriptions, dosage information, and indications displayed on this platform
                            are provided for general informational purposes only and are sourced from manufacturer
                            data. This information may not be complete, up-to-date, or applicable to your specific
                            situation. Always read the package insert and follow your doctor's instructions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Limitation of Liability</h2>
                        <p>
                            MedStore, its directors, employees, and pharmacy partners shall not be liable for any
                            harm, injury, or adverse effects arising from the use of medicines purchased on this
                            platform when used contrary to a doctor's prescription or the manufacturer's instructions.
                        </p>
                    </section>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <h2 className="text-lg font-semibold text-green-900 mb-2">Useful Helplines</h2>
                        <div className="space-y-2 text-green-800 text-sm">
                            <p>🚨 <strong>National Emergency:</strong> <a href="tel:112" className="font-bold underline">112</a></p>
                            <p>🏥 <strong>Ambulance:</strong> <a href="tel:108" className="font-bold underline">108</a></p>
                            <p>💊 <strong>Poison Control (AIIMS Delhi):</strong> <a href="tel:01126593677" className="font-bold underline">011-26593677</a></p>
                            <p>🧠 <strong>Mental Health (iCall):</strong> <a href="tel:9152987821" className="font-bold underline">9152987821</a></p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-500">
                    <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                    <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    <Link to="/support" className="text-blue-600 hover:underline">Contact Support</Link>
                </div>
            </div>
        </div>
    </div>
);

export default MedicalDisclaimer;
