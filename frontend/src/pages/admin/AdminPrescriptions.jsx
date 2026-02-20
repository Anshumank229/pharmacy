import { useEffect, useState, useRef } from "react";
import api from "../../api/axiosClient";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const StatusBadge = ({ status }) => {
    const cfg = {
        pending: { cls: "bg-yellow-100 text-yellow-800", label: "⏳ Pending" },
        approved: { cls: "bg-green-100  text-green-800", label: "✓ Approved" },
        rejected: { cls: "bg-red-100    text-red-800", label: "✗ Rejected" },
    };
    const { cls, label } = cfg[status] || cfg.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
};

const AdminPrescriptions = () => {
    const [tab, setTab] = useState("pending");   // "pending" | "all"
    const [pending, setPending] = useState([]);
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    // Per-card reject state: { [id]: { open: bool, reason: string } }
    const [rejectState, setRejectState] = useState({});
    const textareaRefs = useRef({}); // map of id -> textarea DOM node to preserve caret

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [pendingRes, allRes] = await Promise.allSettled([
                api.get("/prescriptions/pending"),
                api.get("/prescriptions/all"),
            ]);

            if (pendingRes.status === "fulfilled") {
                // Endpoint returns { prescriptions, page, total } — extract the array
                const data = pendingRes.value.data;
                setPending(Array.isArray(data) ? data : (data.prescriptions ?? []));
            }
            if (allRes.status === "fulfilled") {
                const data = allRes.value.data;
                setAll(Array.isArray(data) ? data : (data.prescriptions ?? []));
            }
        } catch (err) {
            toast.error("Failed to load prescriptions");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status, notes = "") => {
        if (status === "rejected" && !notes.trim()) {
            toast.error("Please enter a rejection reason");
            return;
        }
        setProcessingId(id);
        try {
            await api.put(`/prescriptions/${id}`, { status, notes: notes.trim() || undefined });
            toast.success(status === "approved" ? "Prescription approved!" : "Prescription rejected");
            // Optimistic remove from pending list
            setPending(prev => prev.filter(p => p._id !== id));
            // Update in "all" list
            setAll(prev => prev.map(p => p._id === id ? { ...p, status, notes } : p));
            // Close reject panel
            setRejectState(prev => ({ ...prev, [id]: { open: false, reason: "" } }));
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${status} prescription`);
        } finally {
            setProcessingId(null);
        }
    };

    const openReject = (id) =>
        setRejectState(prev => ({ ...prev, [id]: { open: true, reason: prev[id]?.reason || "" } }));

    // Preserve caret/selection when updating controlled textarea value
    const handleReasonChange = (id, e) => {
        const el = e.target;
        const val = el.value;
        const start = el.selectionStart;
        const end = el.selectionEnd;

        setRejectState(prev => ({ ...prev, [id]: { ...prev[id], reason: val } }));

        // Restore selection on next paint (after React updates the value)
        requestAnimationFrame(() => {
            const node = textareaRefs.current[id];
            if (node) {
                try {
                    node.selectionStart = start;
                    node.selectionEnd = end;
                    node.focus();
                } catch (err) {
                    // ignore if browser doesn't allow selection reset
                }
            }
        });
    };

    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const getFileUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith("http")) return imageUrl;           // Cloudinary URL
        return `${API_BASE}${imageUrl}`;                            // local: /uploads/prescriptions/...
    };

    const PrescriptionCard = ({ prescription, showActions }) => {
        const { _id, user, imageUrl, status, notes, createdAt } = prescription;
        const fileUrl = getFileUrl(imageUrl);
        const rs = rejectState[_id] || { open: false, reason: "" };
        const busy = processingId === _id;

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="grid md:grid-cols-5 gap-0">
                    {/* Thumbnail */}
                    <div className="md:col-span-2 bg-gray-50 flex items-center justify-center p-4 min-h-[180px]">
                        {fileUrl ? (
                            imageUrl?.endsWith(".pdf") ? (
                                <div className="text-center">
                                    <div className="text-5xl mb-2">📄</div>
                                    <p className="text-sm text-gray-500">PDF Document</p>
                                </div>
                            ) : (
                                <img
                                    src={fileUrl}
                                    alt="Prescription"
                                    className="max-h-48 max-w-full object-contain rounded-lg"
                                    onError={e => { e.target.style.display = "none"; }}
                                />
                            )
                        ) : (
                            <div className="text-center text-gray-400">
                                <div className="text-4xl mb-1">🖼️</div>
                                <p className="text-xs">No image</p>
                            </div>
                        )}
                    </div>

                    {/* Details + Actions */}
                    <div className="md:col-span-3 p-5 flex flex-col justify-between">
                        <div>
                            {/* Patient info */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">{user?.name || "Unknown User"}</p>
                                    <p className="text-sm text-gray-500">{user?.email || "—"}</p>
                                    <p className="text-xs text-gray-400 mt-1">🕒 {formatDate(createdAt)}</p>
                                </div>
                                <StatusBadge status={status} />
                            </div>

                            {/* Admin notes (for history tab) */}
                            {notes && (
                                <div className={`text-sm rounded-lg p-3 mb-3 ${status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                                    <span className="font-medium">Note: </span>{notes}
                                </div>
                            )}

                            {/* View File */}
                            {fileUrl && (
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mb-3"
                                >
                                    🔍 View File ↗
                                </a>
                            )}
                        </div>

                        {/* Approve / Reject actions (pending only) */}
                        {showActions && (
                            <div className="mt-2">
                                {!rs.open ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateStatus(_id, "approved")}
                                            disabled={busy}
                                            className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            {busy ? "Processing…" : "✓ Approve"}
                                        </button>
                                        <button
                                            onClick={() => openReject(_id)}
                                            disabled={busy}
                                            className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <textarea
                                            dir="ltr"
                                            rows={2}
                                            ref={el => { textareaRefs.current[_id] = el }}
                                            value={rs.reason}
                                            onChange={e => handleReasonChange(_id, e)}
                                            placeholder="Rejection reason (required)…"
                                            className="w-full ltr-textarea border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 resize-none"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateStatus(_id, "rejected", rs.reason)}
                                                disabled={busy || !rs.reason.trim()}
                                                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                            >
                                                {busy ? "Processing…" : "Confirm Reject"}
                                            </button>
                                            <button
                                                onClick={() => setRejectState(prev => ({ ...prev, [_id]: { open: false, reason: "" } }))}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const list = tab === "pending" ? pending : all;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Prescription Approvals</h1>
                <p className="text-gray-500 text-sm mt-1">Review and approve or reject patient prescription uploads</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-200 w-fit">
                {[
                    { key: "pending", label: `Pending Review`, count: pending.length },
                    { key: "all", label: `All Prescriptions`, count: all.length },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        {t.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tab === t.key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                            }`}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : list.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                    <div className="text-5xl mb-4">{tab === "pending" ? "🎉" : "📋"}</div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-1">
                        {tab === "pending" ? "No pending prescriptions" : "No prescriptions yet"}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {tab === "pending"
                            ? "All caught up! New uploads will appear here."
                            : "Patient prescription uploads will appear here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {list.map(p => (
                        <PrescriptionCard
                            key={p._id}
                            prescription={p}
                            showActions={tab === "pending"}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPrescriptions;
