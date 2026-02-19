import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import toast from "react-hot-toast";
import { Search, Filter, MessageSquare, ChevronDown, ChevronUp, CheckCircle, Send, User } from "lucide-react";

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, open, resolved
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    // Reply State
    const [replyMessage, setReplyMessage] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [page, filter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/support/admin", {
                params: { page, limit: 15, status: filter === "all" ? undefined : filter }
            });
            setTickets(res.data.tickets || []);
            setTotalPages(res.data.pages || 1);
        } catch (error) {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (ticketId) => {
        if (!replyMessage.trim()) {
            toast.error("Reply cannot be empty");
            return;
        }

        try {
            setSendingReply(true);
            const res = await api.put(`/support/${ticketId}/reply`, { reply: replyMessage });
            toast.success("Reply sent successfully");

            // Update local state
            setTickets(prev => prev.map(t => t._id === ticketId ? res.data : t));
            setReplyMessage("");
            // Don't collapse, let them see the updated state? Or collapse? Let's keep open.
        } catch (error) {
            toast.error("Failed to send reply");
        } finally {
            setSendingReply(false);
        }
    };

    const handleCloseTicket = async (ticketId) => {
        if (!window.confirm("Are you sure you want to mark this ticket as resolved?")) return;
        try {
            await api.put(`/support/${ticketId}/close`);
            toast.success("Ticket marked as resolved");
            // Update local state
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'resolved' } : t));
        } catch (error) {
            toast.error("Failed to close ticket");
        }
    };

    const toggleExpand = (ticket) => {
        if (expandedTicketId === ticket._id) {
            setExpandedTicketId(null);
            setReplyMessage("");
        } else {
            setExpandedTicketId(ticket._id);
            // Pre-fill reply if editing existing? The requirement was just "If already replied: show previous reply + Update Reply option"
            // For simplicity, we'll iterate on the API's behavior which overwrites reply.
            setReplyMessage(ticket.adminReply || "");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open": return "bg-yellow-100 text-yellow-800";
            case "in-progress": return "bg-blue-100 text-blue-800";
            case "resolved": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
                <div className="flex gap-2">
                    {['all', 'open', 'resolved'].map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No tickets found using current filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Ticket ID</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tickets.map((ticket) => (
                                    <>
                                        <tr
                                            key={ticket._id}
                                            onClick={() => toggleExpand(ticket)}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${expandedTicketId === ticket._id ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-600">#{ticket._id.slice(-8).toUpperCase()}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {ticket.user?.name || 'Unknown User'}
                                                <div className="text-xs text-gray-500 font-normal">{ticket.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 truncate max-w-xs">{ticket.subject}</td>
                                            <td className="px-6 py-4 capitalize text-gray-600">{ticket.category}</td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                {expandedTicketId === ticket._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </td>
                                        </tr>

                                        {/* Expanded View */}
                                        {expandedTicketId === ticket._id && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-6 bg-gray-50 border-b border-gray-100">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                        {/* User Message */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <User className="w-4 h-4 text-gray-500" />
                                                                <h3 className="text-xs font-bold text-gray-500 uppercase">User Message</h3>
                                                            </div>
                                                            <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700 leading-relaxed shadow-sm">
                                                                {ticket.message}
                                                            </div>
                                                        </div>

                                                        {/* Admin Action */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                                                    <h3 className="text-xs font-bold text-blue-600 uppercase">Your Reply</h3>
                                                                </div>
                                                                {ticket.status !== 'resolved' && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleCloseTicket(ticket._id); }}
                                                                        className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200"
                                                                    >
                                                                        <CheckCircle className="w-3 h-3" /> Mark Resolved
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="space-y-3">
                                                                <textarea
                                                                    value={replyMessage}
                                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                                    rows="4"
                                                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                    placeholder="Type your reply here..."
                                                                />
                                                                <div className="flex justify-end">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleReply(ticket._id); }}
                                                                        disabled={sendingReply || !replyMessage.trim()}
                                                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        {sendingReply ? (
                                                                            <>
                                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                                Sending...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Send className="w-4 h-4" />
                                                                                {ticket.adminReply ? "Update Reply" : "Send Reply"}
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                {ticket.repliedAt && (
                                                                    <p className="text-xs text-right text-gray-400">
                                                                        Last replied: {new Date(ticket.repliedAt).toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}{/* Keep simple for now */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                        <button
                            disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                        <button
                            disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
