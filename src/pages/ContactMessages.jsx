import { useEffect, useState } from "react";
import axios from "axios";
import { Phone, MessageSquare, Eye, Trash2, RefreshCw, Search, X } from "lucide-react";
import { useApiConfig } from "@/context/ApiContext";


const STATUS_OPTIONS = [ "New", "In Progress", "Replied", "Resolved", "Spam" ];

const statusStyles = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Replied: "bg-purple-50 text-purple-700 border-purple-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
  Spam: "bg-red-50 text-red-700 border-red-200",
};

const ContactMessages = () => {
  const { API_BASE } = useApiConfig();
  const MESSAGE_API_BASE = `${API_BASE}/message`;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // GET ALL MESSAGES
  const fetchMessages = async (isRefresh = false) => {
    setError("");

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get(`${MESSAGE_API_BASE}/allMessage`);
      const data = response.data;
      const messageList = data.contactMessages || [];

      if (!Array.isArray(messageList)) {
        throw new Error( "Unexpected response format from the server." );
      }

      setMessages(messageList);
    } catch (err) {
      console.error("Fetch messages error:", err);

      setError(err.response?.data?.message || err.message || "Failed to load contact messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);



  // GET SINGLE MESSAGE
  const handleViewMessage = async (id) => {
    setError("");
    setSuccess("");

    try {
      const response = await axios.get(`${MESSAGE_API_BASE}/singleMessage/${id}`);
      const message = response.data.contactMessage 

      if (!message || typeof message !== "object") {
        throw new Error("Message details were not found.");
      }

      setSelectedMessage(message);
    } catch (err) {
      console.error("Get single message error:", err);
      setError( err.response?.data?.message || "Failed to load message details.");
    }
  };

  // UPDATE MESSAGE STATUS
  const handleStatusChange = async (id, status) => {
    setError("");
    setSuccess("");
    setUpdatingId(id);

    try {
      const response = await axios.patch(`${MESSAGE_API_BASE}/update/${id}/status`, { status });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Status update failed.");
      }

      const updatedMessage = response.data.contactMessage || response.data.updatedMessage;

      setMessages((prev) =>
        prev.map((message) =>
          message._id === id
            ? {
                ...message,
                status:
                  updatedMessage?.status || status,
              }
            : message
        )
      );

      setSelectedMessage((prev) =>
        prev?._id === id ? {
              ...prev,
              status: updatedMessage?.status || status,
            }
          : prev
      );

      setSuccess("Message status updated successfully.");
    } catch (err) {
      console.error("Update status error:", err);

      setError( err.response?.data?.message || err.message || "Failed to update message status.");
    } finally {
      setUpdatingId("");
    }
  };

  // DELETE MESSAGE
  const handleDeleteMessage = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this message?");

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await axios.delete(`${MESSAGE_API_BASE}/delete/${id}`);

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Delete failed."
        );
      }

      setMessages((prev) =>
        prev.filter((message) => message._id !== id)
      );

      setSelectedMessage((prev) =>
        prev?._id === id ? null : prev
      );

      setSuccess("Message deleted successfully.");
    } catch (err) {
      console.error("Delete message error:", err);

      setError( err.response?.data?.message || err.message || "Failed to delete message."
      );
    } finally {
      setDeletingId("");
    }
  };

  // SEARCH AND FILTER
  const filteredMessages = messages.filter((message) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch = [
      message.name,
      message.email,
      message.phone,
      message.comment,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    );

    const matchesStatus = filterStatus === "All" || (message.status || "New") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString();
  };

  const statusCounts = STATUS_OPTIONS.reduce(
    (counts, status) => {
      counts[status] = messages.filter(
        (message) => (message.status || "New") === status
      ).length;

      return counts;
    },
    {}
  );

  return (
    <div className="min-h-screen space-y-6 bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Contact Messages
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage customer questions, feedback and support messages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchMessages(true)}
          disabled={refreshing || loading}
          className="flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


{/* SUMMARY CARDS */}
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
  {/* TOTAL MESSAGES */}
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-sm font-medium text-gray-600">
      Total Messages
    </p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {messages.length}
    </p>
  </div>

  {/* NEW */}
  <div className="rounded-xl border border-blue-200 bg-white p-4">
    <p className="text-sm font-medium text-blue-700">
      New
    </p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {statusCounts.New || 0}
    </p>
  </div>

  {/* IN PROGRESS */}
  <div className="rounded-xl border border-amber-200 bg-white p-4">
    <p className="text-sm font-medium text-amber-700">
      In Progress
    </p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {statusCounts["In Progress"] || 0}
    </p>
  </div>

  {/* REPLIED */}
  <div className="rounded-xl border border-purple-200 bg-white p-4">
    <p className="text-sm font-medium text-purple-700">
      Replied
    </p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {statusCounts.Replied || 0}
    </p>
  </div>

  {/* RESOLVED */}
  <div className="rounded-xl border border-green-200 bg-white p-4">
    <p className="text-sm font-medium text-green-700">
      Resolved
    </p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {statusCounts.Resolved || 0}
    </p>
  </div>

  {/* SPAM */}
  <div className="rounded-xl border border-red-200 bg-white p-4">
    <p className="text-sm font-medium text-red-700">
      Spam
    </p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {statusCounts.Spam || 0}
    </p>
  </div>
</div>


      {/* MESSAGES TABLE CARD */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Messages
            </h2>

            <p className="mt-1 text-sm text-gray-500">
            <span className="font-bold">{filteredMessages.length}</span> Messages found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-gray-500 sm:w-64"
              />
            </div>

            {/* STATUS FILTER */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-500"
            >
              <option value="All">All Statuses</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading messages...
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              No messages found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Phone</th>
                  <th className="px-5 py-4 font-semibold">Message</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((message) => {
                  const status = message.status || "New";

                  return (
                    <tr
                      key={message._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* CUSTOMER */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {message.name}
                        </p>

                        <p className="mt-1 text-gray-500">
                          {message.email}
                        </p>
                      </td>

                      {/* PHONE */}
                      <td className="px-5 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                          {message.phone}
                        </div>
                      </td>

                      {/* COMMENT */}
                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate text-gray-600">
                          {message.comment}
                        </p>
                      </td>

                      {/* DATE */}
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatDate(message.createdAt)}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <select
                          value={status}
                          disabled={updatingId === message._id}
                          onChange={(e) =>
                            handleStatusChange(
                              message._id,
                              e.target.value
                            )
                          }
                          aria-label={`Update status for ${message.name}`}
                          className={`rounded-lg border px-2.5 py-2 text-xs font-semibold outline-none disabled:opacity-60 ${
                            statusStyles[status] ||
                            "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        {updatingId === message._id && (
                          <p className="mt-1 text-xs text-gray-500">
                            Updating...
                          </p>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleViewMessage(message._id)
                            }
                            title="View message"
                            aria-label="View message"
                            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteMessage(message._id)
                            }
                            disabled={deletingId === message._id}
                            title="Delete message"
                            aria-label="Delete message"
                            className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === message._id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-details-title"
            className="my-auto w-full max-w-xl rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2
                  id="message-details-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Message Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Customer contact information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close message details"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Name
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedMessage.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Email
                </p>
                <p className="mt-1 break-all text-gray-800">
                  {selectedMessage.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Phone
                </p>
                <p className="mt-1 text-gray-800">
                  {selectedMessage.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Message
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 leading-7 text-gray-700">
                  {selectedMessage.comment}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>

                <span
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    statusStyles[selectedMessage.status || "New"] ||
                    "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {selectedMessage.status || "New"}
                </span>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
