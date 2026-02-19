import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">{title}</h2>
        <div className="text-gray-600 space-y-3 leading-relaxed">{children}</div>
    </section>
);

const TermsOfService = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-sm text-gray-400">Last updated: February 2026 · Governed by Indian Law</p>
            </div>

            <Section title="1. Nature of Platform">
                <p>
                    MedStore is a <strong>technology intermediary</strong> and digital marketplace that connects customers
                    with licensed pharmacies and healthcare providers. MedStore itself is <strong>not a pharmacy</strong> and
                    does not dispense, store, or sell medicines directly. All dispensing is carried out by licensed
                    pharmacist partners in compliance with the Drugs and Cosmetics Act, 1940.
                </p>
            </Section>

            <Section title="2. Prescription Medicines">
                <p>
                    Medicines classified as "Schedule H", "Schedule H1", or "Schedule X" under the Drugs and Cosmetics
                    Act, 1940 can only be dispensed against a <strong>valid prescription</strong> issued by a registered
                    medical practitioner (RMP). By uploading a prescription, you confirm that:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>The prescription is genuine and has not been altered.</li>
                    <li>It was issued to you personally by a licensed doctor.</li>
                    <li>You are the patient named on the prescription.</li>
                </ul>
                <p className="mt-2 text-red-600 font-medium">
                    Uploading a forged or altered prescription is a criminal offence under the Indian Penal Code and
                    the Drugs and Cosmetics Act. MedStore reserves the right to report such instances to the
                    appropriate authorities.
                </p>
            </Section>

            <Section title="3. User Responsibilities">
                <p>You are solely responsible for:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>The accuracy and authenticity of all prescriptions uploaded.</li>
                    <li>Providing correct delivery address and contact information.</li>
                    <li>Ensuring medicines are stored as per the manufacturer's instructions upon receipt.</li>
                    <li>Not sharing prescription medicines with other individuals.</li>
                </ul>
            </Section>

            <Section title="4. Refund & Return Policy">
                <p>We accept returns and issue refunds in the following cases only:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Damaged items:</strong> Report within <strong>24 hours of delivery</strong> with photographic evidence.</li>
                    <li><strong>Wrong item delivered:</strong> Report within <strong>24 hours of delivery</strong>.</li>
                    <li><strong>Expired medicines:</strong> Report within <strong>24 hours of delivery</strong>.</li>
                </ul>
                <p className="mt-2">
                    Opened medicines, temperature-sensitive products, and Schedule X drugs are <strong>non-returnable</strong> due
                    to safety regulations. Refunds are processed within 5–7 business days to the original payment method.
                </p>
                <p className="mt-2">
                    To initiate a return, email <a href="mailto:support@medstore.in" className="text-blue-600 hover:underline">support@medstore.in</a> with
                    your order ID and photos of the issue.
                </p>
            </Section>

            <Section title="5. Governing Law & Jurisdiction">
                <p>
                    These Terms are governed by and construed in accordance with the laws of India, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Information Technology Act, 2000 (and its amendments)</li>
                    <li>Drugs and Cosmetics Act, 1940</li>
                    <li>Consumer Protection Act, 2019</li>
                    <li>Digital Personal Data Protection Act, 2023</li>
                </ul>
                <p className="mt-2">
                    Any disputes shall be subject to the exclusive jurisdiction of courts in New Delhi, India.
                </p>
            </Section>

            <Section title="6. Limitation of Liability">
                <p>
                    MedStore's liability is limited to the value of the order in dispute. We are not liable for any
                    indirect, incidental, or consequential damages arising from the use of medicines purchased on
                    this platform. Medical decisions remain solely the responsibility of the patient and their
                    treating physician.
                </p>
            </Section>

            <Section title="7. Contact for Disputes">
                <p>
                    For any disputes, complaints, or grievances, please contact our Grievance Officer:
                </p>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 text-sm">
                    <p><strong>Email:</strong> <a href="mailto:grievance@medstore.in" className="text-blue-600 hover:underline">grievance@medstore.in</a></p>
                    <p><strong>Response time:</strong> Within 48 business hours</p>
                    <p><strong>Escalation:</strong> <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">consumerhelpline.gov.in</a></p>
                </div>
            </Section>

            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-500">
                <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                <Link to="/disclaimer" className="text-blue-600 hover:underline">Medical Disclaimer</Link>
                <Link to="/support" className="text-blue-600 hover:underline">Contact Support</Link>
            </div>
        </div>
    </div>
);

export default TermsOfService;
