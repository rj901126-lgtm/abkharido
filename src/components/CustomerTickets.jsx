import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { HeadphonesIcon, MessageSquare, Send, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CustomerTickets = () => {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  
  // New Ticket State
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  // Reply State
  const [replyContent, setReplyContent] = useState('');

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('abkharido_token');
      if (!token) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    try {
      const token = sessionStorage.getItem('abkharido_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          subject: newSubject,
          message: newMessage,
          priority: 'Medium'
        })
      });

      if (res.ok) {
        showToast('Support ticket created successfully', 'success');
        setNewSubject('');
        setNewMessage('');
        setIsCreating(false);
        fetchMyTickets();
      } else {
        showToast('Failed to create ticket', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeTicket) return;

    try {
      const token = sessionStorage.getItem('abkharido_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets/${activeTicket._id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: replyContent })
      });

      if (res.ok) {
        const updatedTicket = await res.json();
        setActiveTicket(updatedTicket);
        setReplyContent('');
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Error sending reply', 'error');
    }
  };

  const handleViewTicket = async (id) => {
    try {
      const token = sessionStorage.getItem('abkharido_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveTicket(await res.json());
        setIsCreating(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (activeTicket) {
    return (
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '500px' }}>
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{activeTicket.subject}</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Status: <strong>{activeTicket.status}</strong></span>
          </div>
          <button onClick={() => setActiveTicket(null)} className="btn btn-outline" style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}>
            Back to Tickets
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f1f5f9' }}>
          {activeTicket.messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isAdmin ? 'flex-start' : 'flex-end' }}>
              <div style={{ 
                maxWidth: '80%', padding: '12px 16px', borderRadius: '12px',
                background: msg.isAdmin ? '#fff' : '#4f46e5',
                color: msg.isAdmin ? '#334155' : '#fff',
                border: msg.isAdmin ? '1px solid #e2e8f0' : 'none',
                borderBottomLeftRadius: msg.isAdmin ? '4px' : '12px',
                borderBottomRightRadius: msg.isAdmin ? '12px' : '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                {msg.isAdmin ? 'AbKharido Support' : 'You'} • {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          <form onSubmit={handleReply} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={activeTicket.status === 'Closed' ? 'Ticket is closed.' : 'Type your reply...'}
              disabled={activeTicket.status === 'Closed' || activeTicket.status === 'Resolved'}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={!replyContent.trim() || activeTicket.status === 'Closed' || activeTicket.status === 'Resolved'}
              className="btn btn-primary"
              style={{ borderRadius: '24px', padding: '0 20px' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeadphonesIcon size={20} color="#4f46e5" /> Raise New Ticket
        </h3>
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Subject/Issue</label>
            <input 
              type="text" 
              required
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              placeholder="e.g., Order not delivered yet"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Describe your issue</label>
            <textarea 
              required
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Please provide details so our support team can help you faster..."
              rows={4}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Ticket</button>
            <button type="button" onClick={() => setIsCreating(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>My Support Tickets</h3>
        <button onClick={() => setIsCreating(true)} className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px', height: 'auto' }}>
          + Raise Ticket
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '40px 20px', textAlign: 'center' }}>
          <MessageSquare size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 8px', color: '#334155' }}>No active tickets</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>If you face any issues with your orders, you can raise a ticket here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tickets.map(t => (
            <div 
              key={t._id} 
              onClick={() => handleViewTicket(t._id)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>{t.subject}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Last updated: {new Date(t.updatedAt).toLocaleDateString()}</div>
              </div>
              <span style={{ 
                fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold',
                background: t.status === 'Open' ? '#fee2e2' : t.status === 'In Progress' ? '#fef3c7' : '#dcfce7',
                color: t.status === 'Open' ? '#ef4444' : t.status === 'In Progress' ? '#d97706' : '#10b981'
              }}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerTickets;
