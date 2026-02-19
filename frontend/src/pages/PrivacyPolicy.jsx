import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">{title}</h2>
        <div className="text-gray-600 space-y-3 leading-relaxed">{children}</div>
    </section>
);

const PrivacyPolicy = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-400">Last updated: February 2026 · DPDP Act 2023 Compliant</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
                <strong>DPDP Act 2023 Compliance:</strong> This policy is drafted in compliance with India's
                Digital Personal Data Protection Act, 2023. You have the right to access, correct, and erase
                your personal data held by MedStore.
            </div>

            <Section title="1. Data We Collect">
                <p>We collect the following categories of personal data when you use MedStore:</p>
                <div className="mt-3 space-y-3">
                    {[
                        { label: "Identity Data", items: "Full name, date of birth (optional)" },
                        { label: "Contact Data", items: "Email address, phone number, delivery address" },
                        { label: "Account Data", items: "Encrypted password hash, account preferences" },
                        { label: "Health Data (Sensitive)", items: "Prescription images uploaded for medicine orders" },
                        { label: "Transaction Data", items: "Order history, payment method type (not card numbers — processed by Razorpay)" },
                        { label: "Technical Data", items: "IP address, browser type, device information (for security)" },
                    ].map(({ label, items }) => (
                        <div key={label} className="flex gap-3">
                            <span className="font-medium text-gray-800 min-w-[160px]">{label}:</span>
                            <span>{items}</span>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="2. How We Store & Protect Your Data">
                <p>Your data is stored securely with the following protections:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>All data is stored on <strong>MongoDB Atlas</strong> with encryption at rest (AES-256).</li>
                    <li>Passwords are hashed using <strong>bcrypt</strong> and never stored in plain text.</li>
                    <li>All data transmission uses <strong>HTTPS/TLS 1.3</strong> encryption.</li>
                    <li>Authentication uses <strong>HTTPOnly cookies</strong> to prevent XSS attacks.</li>
                    <li>Access to production databases is restricted to authorised personnel only.</li>
                </ul>
            </Section>

            <Section title="3. Prescription Images (Sensitive Health Data)">
                <p>
                    Prescription images you upload are treated as <strong>sensitive personal data</strong> under the
                    DPDP Act 2023 and the IT (Reasonable Security Practices) Rules, 2011.
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>Prescription images are <strong>only accessed by our licensed pharmacists</strong> for the purpose of verifying your medicine order.</li>
                    <li>Images are stored securely and are <strong>not used for any other purpose</strong>.</li>
                    <li>Prescription images are <strong>never shared with third parties</strong> except the dispensing pharmacy partner.</li>
                    <li>You may request deletion of your prescription images at any time (see Section 6).</li>
                </ul>
            </Section>

            <Section title="4. How We Use Your Data">
                <p>We use your personal data only for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>Processing and fulfilling your medicine orders.</li>
                    <li>Verifying prescriptions with licensed pharmacists.</li>
                    <li>Sending order confirmations and delivery updates.</li>
                    <li>Responding to your support queries.</li>
                    <li>Fraud prevention and platform security.</li>
                    <li>Complying with legal obligations (e.g., maintaining prescription records as required by law).</li>
                </ul>
            </Section>

            <Section title="5. Data Sharing">
                <p>
                    <strong>We never sell your personal data to third parties.</strong> We share data only with:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Razorpay</strong> — for payment processing (they receive only transaction data, not your health data).</li>
                    <li><strong>Pharmacy partners</strong> — for dispensing medicines (they receive your prescription and delivery address only).</li>
                    <li><strong>Delivery partners</strong> — for shipping (name and delivery address only).</li>
                    <li><strong>Law enforcement</strong> — only when required by a valid court order or legal process.</li>
                </ul>
            </Section>

            <Section title="6. Your Rights (DPDP Act 2023)">
                <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Access</strong> — Request a copy of all personal data we hold about you.</li>
                    <li><strong>Correction</strong> — Request correction of inaccurate personal data.</li>
                    <li><strong>Erasure</strong> — Request deletion of your account and associated data.</li>
                    <li><strong>Grievance Redressal</strong> — Lodge a complaint with our Data Protection Officer.</li>
                </ul>
                <p className="mt-3">
                    To exercise any of these rights, email us at{" "}
                    <a href="mailto:privacy@medstore.in" className="text-blue-600 hover:underline">privacy@medstore.in</a>{" "}
                    with the subject line "Data Request — [Your Name]". We will respond within <strong>30 days</strong>.
                </p>
            </Section>

            <Section title="7. Data Retention">
                <p>
                    We retain your personal data for as long as your account is active. Prescription records are
                    retained for <strong>2 years</strong> as required by the Drugs and Cosmetics Act, 1940, after which
                    they are permanently deleted. You may request earlier deletion of non-legally-mandated data at
                    any time.
                </p>
            </Section>

            <Section title="8. Cookies">
                <p>
                    We use only essential cookies required for authentication (HTTPOnly session cookies). We do not
                    use tracking cookies, advertising cookies, or third-party analytics cookies.
                </p>
            </Section>

            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-500">
                <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                <Link to="/disclaimer" className="text-blue-600 hover:underline">Medical Disclaimer</Link>
                <Link to="/support" className="text-blue-600 hover:underline">Contact Support</Link>
            </div>
        </div>
    </div>
);

export default PrivacyPolicy;
