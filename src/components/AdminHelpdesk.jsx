import React, { useState, useEffect, useRef } from 'react';
import { HeadphonesIcon, Search, CheckCircle, Clock, AlertCircle, MessageSquare, Send, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminHelpdesk = () => {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState('All'); // All, Open, In Progress, Resolved
  const chatEndRef = useRef(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch('/api/tickets', { headers: { 'x-admin-token': token } });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      showToast('Error loading tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket]);

  const handleSelectTicket = async (id) => {
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`/api/tickets/${id}`, { headers: { 'x-admin-token': token } });
      if (res.ok) {
        setActiveTicket(await res.json());
      }
    } catch (err) {
      showToast('Error loading ticket details', 'error');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeTicket) return;

    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`/api/tickets/${activeTicket._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ content: replyContent })
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setActiveTicket(updatedTicket);
        setReplyContent('');
        
        // Update ticket in list
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      }
    } catch (err) {
      showToast('Error sending reply', 'error');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeTicket) return;
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`/api/tickets/${activeTicket._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setActiveTicket(updatedTicket);
        showToast(`Ticket marked as ${status}`, 'success');
        
        // Update ticket in list
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      }
    } catch (err) {
      showToast('Error updating ticket status', 'error');
    }
  };

  const filteredTickets = filter === 'All' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
      
      {/* ── Left Column: Ticket Queue ── */}
      <div className="admin-panel-card" style={{ width: '350px', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
            <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}><HeadphonesIcon size={20} /></div>
            Support Inbox
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                style={{ 
                  flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: filter === f ? '#4f46e5' : '#e2e8f0',
                  color: filter === f ? '#fff' : '#64748b'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No tickets found.</div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket._id} 
                onClick={() => handleSelectTicket(ticket._id)}
                style={{ 
                  padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTicket?._id === ticket._id ? '#eff6ff' : 'transparent',
                  borderLeft: activeTicket?._id === ticket._id ? '4px solid #3b82f6' : '4px solid transparent'
                }}
                onMouseEnter={e => { if(activeTicket?._id !== ticket._id) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                onMouseLeave={e => { if(activeTicket?._id !== ticket._id) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>{ticket.subject}</div>
                  <span style={{ 
                    fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold',
                    background: ticket.status === 'Open' ? '#fee2e2' : ticket.status === 'In Progress' ? '#fef3c7' : '#dcfce7',
                    color: ticket.status === 'Open' ? '#ef4444' : ticket.status === 'In Progress' ? '#d97706' : '#10b981'
                  }}>
                    {ticket.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{ticket.customerId?.name || 'Customer'}</span>
                  <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Column: Ticket Chat Thread ── */}
      <div className="admin-panel-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {activeTicket ? (
          <>
            {/* Thread Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>{activeTicket.subject}</h3>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
                  <span>Ticket ID: {activeTicket._id}</span>
                  <span>Customer: {activeTicket.customerId?.name} ({activeTicket.customerId?.email})</span>
                  {activeTicket.orderId && <span>Order Ref: {activeTicket.orderId._id || activeTicket.orderId}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {activeTicket.status !== 'Resolved' && activeTicket.status !== 'Closed' && (
                  <button onClick={() => handleUpdateStatus('Resolved')} className="btn btn-outline" style={{ color: '#10b981', borderColor: '#10b981', display: 'flex', gap: '6px', alignItems: 'center', height: '36px', padding: '0 16px' }}>
                    <CheckCircle size={16} /> Mark Resolved
                  </button>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTicket.messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: msg.isAdmin ? 'flex-end' : 'flex-start' 
                }}>
                  <div style={{ 
                    maxWidth: '70%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    background: msg.isAdmin ? '#eff6ff' : '#f1f5f9',
                    color: msg.isAdmin ? '#1e3a8a' : '#334155',
                    border: msg.isAdmin ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                    borderBottomRightRadius: msg.isAdmin ? '4px' : '12px',
                    borderBottomLeftRadius: msg.isAdmin ? '12px' : '4px'
                  }}>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {msg.isAdmin ? <HeadphonesIcon size={12} /> : <User size={12} />}
                    {msg.isAdmin ? 'Support Team' : activeTicket.customerId?.name} • {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input */}
            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <form onSubmit={handleReply} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={activeTicket.status === 'Resolved' || activeTicket.status === 'Closed' ? "Ticket is resolved." : "Type your reply to the customer..."}
                  disabled={activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
                <button 
                  type="submit" 
                  disabled={!replyContent.trim() || activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'}
                  className="btn btn-primary" 
                  style={{ padding: '0 24px', height: '44px', display: 'flex', gap: '8px', alignItems: 'center', opacity: (!replyContent.trim() || activeTicket.status === 'Resolved') ? 0.6 : 1 }}
                >
                  Send <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '12px' }}>
            <MessageSquare size={48} opacity={0.2} />
            <p>Select a ticket from the queue to view details and reply.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminHelpdesk;
