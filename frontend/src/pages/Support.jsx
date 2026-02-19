import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosClient";
import toast from "react-hot-toast";
import { Package, MessageSquare, PlusCircle, ChevronDown, ChevronUp, User } from "lucide-react";
import PageLoader from "../components/PageLoader";

const Support = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("new"); // "new" or "my"
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("order");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // My Tickets State
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    useEffect(() => {
        if (activeTab === "my") {
            fetchMyTickets();
        }
    }, [activeTab]);

    const fetchMyTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/support/my");
            setTickets(res.data.tickets || []);
        } catch (error) {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setSubmitting(true);
            await api.post("/support", { subject, category, message });
            toast.success("Ticket created successfully");
            setSubject("");
            setMessage("");
            setCategory("order");
            setActiveTab("my"); // Switch to list view
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create ticket");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedTicketId(expandedTicketId === id ? null : id);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "open": return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Open</span>;
            case "in-progress": return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">In Progress</span>;
            case "resolved": return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Resolved</span>;
            default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Customer Support
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                        We're here to help! Search for answers or contact our support team.
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("new")}
                            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "new" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <PlusCircle className="w-5 h-5" /> New Ticket
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("my")}
                            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "my" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MessageSquare className="w-5 h-5" /> My Tickets
                            </div>
                        </button>
                    </div>

                    {/* New Ticket Form */}
                    {activeTab === "new" && (
                        <div className="p-6 sm:p-10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        maxLength={150}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Brief summary of your issue"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4 border"
                                        required
                                    />
                                    <div className="text-right text-xs text-gray-400 mt-1">{subject.length}/150</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4 border bg-white"
                                    >
                                        <option value="order">Order Issue</option>
                                        <option value="payment">Payment Issue</option>
                                        <option value="prescription">Prescription</option>
                                        <option value="medicine">Medicine Query</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        rows={6}
                                        maxLength={2000}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your issue in detail..."
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4 border"
                                        required
                                    />
                                    <div className="text-right text-xs text-gray-400 mt-1">{message.length}/2000</div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                                    >
                                        {submitting ? "Submitting..." : "Submit Ticket"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* My Tickets List */}
                    {activeTab === "my" && (
                        <div className="p-6 sm:p-8 bg-gray-50/50 min-h-[400px]">
                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-16">
                                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No support tickets yet</h3>
                                    <p className="mt-1 text-gray-500">Create a ticket if you need specific help with an order or product.</p>
                                    <button
                                        onClick={() => setActiveTab("new")}
                                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                    >
                                        Create New Ticket
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tickets.map((ticket) => (
                                        <div
                                            key={ticket._id}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                        >
                                            <div
                                                onClick={() => toggleExpand(ticket._id)}
                                                className="p-5 cursor-pointer flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${expandedTicketId === ticket._id ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        <MessageSquare className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 mb-0.5 max-w-md truncate">
                                                            {ticket.subject}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                                                #{ticket._id.slice(-8).toUpperCase()}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{ticket.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {getStatusBadge(ticket.status)}
                                                    {expandedTicketId === ticket._id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                </div>
                                            </div>

                                            {expandedTicketId === ticket._id && (
                                                <div className="border-t border-gray-100 bg-gray-50 p-5 sm:p-6 animate-in slide-in-from-top-1 duration-200">
                                                    {/* User Query */}
                                                    <div className="mb-6">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                            <span className="text-xs font-bold text-gray-500 uppercase">Your Message</span>
                                                        </div>
                                                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                                                            {ticket.message}
                                                        </div>
                                                    </div>

                                                    {/* Admin Reply */}
                                                    {ticket.adminReply ? (
                                                        <div className="pl-4 border-l-2 border-blue-200">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">S</div>
                                                                <span className="text-xs font-bold text-blue-600 uppercase">Support Team Reply</span>
                                                                <span className="text-xs text-gray-400">• {new Date(ticket.repliedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-900 text-sm leading-relaxed">
                                                                {ticket.adminReply}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-gray-100 p-3 rounded-lg">
                                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                            Awaiting reply from our support team...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Support;
