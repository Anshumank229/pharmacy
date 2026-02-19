import SupportTicket from "../models/SupportTicket.js";
import { sendTicketConfirmationEmail, sendTicketReplyEmail } from "../services/emailService.js";

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req, res) => {
    try {
        const { subject, category, message } = req.body;

        if (!subject || !category || !message) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        const validCategories = ["order", "payment", "prescription", "medicine", "other"];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid category" });
        }

        const ticket = await SupportTicket.create({
            user: req.user._id,
            subject,
            category,
            message,
        });

        // Send confirmation email (fire-and-forget)
        sendTicketConfirmationEmail(
            req.user.email,
            req.user.name,
            ticket._id.toString().slice(-8).toUpperCase(),
            subject
        ).catch((err) => console.error("Ticket confirmation email failed:", err.message));

        res.status(201).json(ticket);
    } catch (error) {
        console.error("Create ticket error:", error);
        res.status(500).json({ message: "Failed to create ticket" });
    }
};

// @desc    Get current user's tickets (paginated)
// @route   GET /api/support/my
// @access  Private
export const getMyTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await SupportTicket.countDocuments({ user: req.user._id });
        const tickets = await SupportTicket.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tickets" });
    }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/support/admin
// @access  Private/Admin
export const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { status } = req.query;

        const query = {};
        if (status && status !== "all") {
            query.status = status;
        }

        const total = await SupportTicket.countDocuments(query);
        const tickets = await SupportTicket.find(query)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error("Fetch all tickets error:", error);
        res.status(500).json({ message: "Failed to fetch tickets" });
    }
};

// @desc    Reply to a ticket (Admin)
// @route   PUT /api/support/:id/reply
// @access  Private/Admin
export const replyToTicket = async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) {
            return res.status(400).json({ message: "Reply message is required" });
        }

        const ticket = await SupportTicket.findById(req.params.id).populate("user", "name email");
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        ticket.adminReply = reply;
        ticket.repliedAt = Date.now();
        ticket.status = "in-progress"; // Automatically mark as in-progress on reply
        await ticket.save();

        // Send reply email
        if (ticket.user) {
            sendTicketReplyEmail(
                ticket.user.email,
                ticket.user.name,
                ticket._id.toString().slice(-8).toUpperCase(),
                ticket.subject,
                reply
            ).catch((err) => console.error("Ticket reply email failed:", err.message));
        }

        res.json(ticket);
    } catch (error) {
        console.error("Reply ticket error:", error);
        res.status(500).json({ message: "Failed to reply to ticket" });
    }
};

// @desc    Close a ticket (Admin)
// @route   PUT /api/support/:id/close
// @access  Private/Admin
export const closeTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        ticket.status = "resolved";
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: "Failed to close ticket" });
    }
};

// @desc    Get open tickets count (Admin)
// @route   GET /api/support/admin/count
// @access  Private/Admin
export const getOpenTicketCount = async (req, res) => {
    try {
        const count = await SupportTicket.countDocuments({ status: "open" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: "Failed to get count" });
    }
}
