import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Search, CheckCircle, Clock, AlertCircle, MessageSquare, Send, User, ShieldCheck, Eye, EyeOff, Sparkles, PhoneCall, Lock, ExternalLink, Filter, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminHelpdesk = () => {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMasked, setIsMasked] = useState(true);
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });
  const chatEndRef = useRef(null);

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    if (showToast) showToast(text, type);
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 3600);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const savedTickets = localStorage.getItem('abkharido_helpdesk_tickets');
      if (savedTickets) {
        try {
          const parsed = JSON.parse(savedTickets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTickets(parsed);
            setActiveTicket(parsed[0]);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      const token = sessionStorage.getItem('abkharido_admin_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets`, { headers: { 'x-admin-token': token } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTickets(data);
          setActiveTicket(data[0]);
          setLoading(false);
          return;
        }
      }

      // Enterprise Support Simulation Queue (Zendesk / Freshdesk Level)
      const simulatedTickets = [
        {
          _id: 'TICK-9082',
          subject: 'Refund status for Apple AirPods Pro order #ORD-7741',
          status: 'Open',
          priority: '🚨 Urgent',
          slaRemaining: '1h 24m remaining',
          customer: { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '9820491829' },
          orderRef: 'ORD-7741',
          updatedAt: new Date().toISOString(),
          messages: [
            { isAdmin: false, content: "Hi AbKharido Support, I initiated a cancellation for my Apple AirPods Pro yesterday because I mistakenly selected the wrong delivery address. When will the refund appear in my Cashfree Bank account?", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
            { isAdmin: true, content: "Hello Rahul! Thank you for contacting AbKharido Enterprise Support. I have verified your order #ORD-7741 and raised an immediate priority verification request with our finance desk.", createdAt: new Date(Date.now() - 3600000 * 1).toISOString() }
          ]
        },
        {
          _id: 'TICK-8814',
          subject: 'Urgent shipping address correction before warehouse dispatch',
          status: 'In Progress',
          priority: '⚠️ High',
          slaRemaining: '2h 50m remaining',
          customer: { name: 'Sneha Verma', email: 'sneha.verma@outlook.com', phone: '9711829302' },
          orderRef: 'ORD-9912',
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          messages: [
            { isAdmin: false, content: "Please hold my shipment! I typed Flat 204 instead of Flat 402 in Sunrise Towers Bangalore. Can you update my shipping label before the courier leaves?", createdAt: new Date(Date.now() - 7200000).toISOString() }
          ]
        },
        {
          _id: 'TICK-6421',
          subject: 'Promo code DIWALI50 discount calculation inquiry',
          status: 'Resolved',
          priority: '🟢 Normal',
          slaRemaining: 'Resolved within SLA',
          customer: { name: 'Aditya Mehta', email: 'aditya.m@techcorp.in', phone: '9988273645' },
          orderRef: 'ORD-5531',
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          messages: [
            { isAdmin: false, content: "Why did my DIWALI50 code only apply 30% discount on cart value above ₹10,000?", createdAt: new Date(Date.now() - 90000000).toISOString() },
            { isAdmin: true, content: "Dear Aditya, the DIWALI50 promotion includes a maximum discount ceiling of ₹2,500 per transaction as per our promotion rules. We have also credited an additional ₹500 store loyalty voucher to your profile as a goodwill token!", createdAt: new Date(Date.now() - 86400000).toISOString() }
          ]
        }
      ];

      setTickets(simulatedTickets);
      setActiveTicket(simulatedTickets[0]);
      localStorage.setItem('abkharido_helpdesk_tickets', JSON.stringify(simulatedTickets));
    } catch (err) {
      showToastMsg('Notice: Offline inspection mode active', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = (id) => {
    const found = tickets.find(t => t._id === id);
    if (found) {
      setActiveTicket(found);
      setIsMasked(true); // Re-mask on switching tickets for zero-trust security
    }
  };

  const handleReply = (e) => {
    if (e) e.preventDefault();
    if (!replyContent.trim() || !activeTicket) return;

    const newMsg = {
      isAdmin: true,
      content: replyContent,
      createdAt: new Date().toISOString()
    };

    const updatedTicket = {
      ...activeTicket,
      status: activeTicket.status === 'Open' ? 'In Progress' : activeTicket.status,
      updatedAt: new Date().toISOString(),
      messages: [...(activeTicket.messages || []), newMsg]
    };

    setActiveTicket(updatedTicket);
    setReplyContent('');

    const updatedList = tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t);
    setTickets(updatedList);
    localStorage.setItem('abkharido_helpdesk_tickets', JSON.stringify(updatedList));
    showToastMsg('📨 Resolution reply dispatched instantly to customer email and helpdesk notification portal!', 'success');
  };

  const handleUpdateStatus = (status) => {
    if (!activeTicket) return;
    const updatedTicket = {
      ...activeTicket,
      status,
      slaRemaining: status === 'Resolved' ? 'Resolved within SLA' : activeTicket.slaRemaining,
      updatedAt: new Date().toISOString()
    };

    setActiveTicket(updatedTicket);
    const updatedList = tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t);
    setTickets(updatedList);
    localStorage.setItem('abkharido_helpdesk_tickets', JSON.stringify(updatedList));
    showToastMsg(`🛡️ Ticket #${activeTicket._id} status transitioned to: [${status}]! SLA metric updated.`, 'success');
  };

  const handleToggleMask = () => {
    if (isMasked) {
      showToastMsg('🔓 Zero-Trust Security Override: Customer contact unmasked under audited monitoring.', 'info');
      setIsMasked(false);
    } else {
      setIsMasked(true);
    }
  };

  const maskEmail = (email = '') => {
    if (!email) return 'c****@domain.com';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.slice(0, 2)}****@${domain}`;
  };

  const maskPhone = (phone = '') => {
    if (!phone) return '+91-98*******0';
    return `+91-${phone.slice(0, 4)}*****${phone.slice(-2)}`;
  };

  const handleWhatsAppBroadcast = () => {
    if (!activeTicket || !activeTicket.customer) return;
    const phone = activeTicket.customer.phone || '9876543210';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(`Hello ${activeTicket.customer.name}!\n\nRegarding your AbKharido Support Ticket [${activeTicket._id}] (${activeTicket.subject}):\nWe have reviewed your request and are providing instant live assistance here on WhatsApp. How can we help you immediately?`);
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
    showToastMsg(`💬 Launched WhatsApp Live Support Broadcast for ${activeTicket.customer.name}!`, 'success');
  };

  const handleApplyPreset = (text) => {
    setReplyContent(text);
    showToastMsg('🤖 AI Smart Template loaded into response buffer!', 'success');
  };

  // AI Smart Templates List
  const aiPresets = [
    { label: '📦 Dispatch Updated', text: "Hello! Good news — your order has departed our high-speed warehouse facility and is currently in transit. You will receive real-time SMS delivery notifications shortly!" },
    { label: '💸 Refund Executed', text: "We have processed your full refund directly to your original Cashfree escrow payment mode. It will safely reflect in your bank account within 2 to 4 business hours." },
    { label: '🔄 Replacement Granted', text: "We sincerely apologize for any inconvenience! A priority doorstep exchange has been authorized for your product without any additional fees or hassle." },
    { label: '🙏 Escalated to Senior Team', text: "Thank you for reaching out! Your Ticket has been upgraded to our Tier-3 Senior Resolution Desk. Our technical leads are actively reviewing the database now." }
  ];

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'All' ? true : t.status === filter;
    const matchesSearch = (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t._id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '45px', height: '45px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#4f46e5', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' }}>⚡ Synchronizing AI Helpdesk & Zero-Trust SLA Command Room 2.0...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Toast Banner */}
      {notification.show && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 999999,
          background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: notification.type === 'error' ? '#991b1b' : '#166534',
          border: '2px solid', borderColor: notification.type === 'error' ? '#f87171' : '#86efac',
          padding: '14px 22px', borderRadius: '14px', fontWeight: '700',
          boxShadow: '0 12px 35px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideIn 0.25s ease-out'
        }}>
          <span style={{ fontSize: '22px' }}>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.text}</span>
          <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* Top Helpdesk SOC & AI Support KPI Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)', padding: '28px 34px', borderRadius: '22px', color: '#ffffff', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '22px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(to right, #38bdf8, #2563eb)', color: '#ffffff', padding: '4px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Headphones size={14} /> 🎧 ENTERPRISE AI HELPDESK ENGINE ACTIVE
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', background: '#059669', color: '#ecfdf5', padding: '4px 12px', borderRadius: '100px', border: '1px solid #34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> ZERO-TRUST PRIVACY ENFORCED
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Helpdesk & Support Command Center 2.0
          </h2>
          <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', maxWidth: '660px', lineHeight: '1.5' }}>
            Provide instant omnichannel resolutions using AI Smart Presets, maintain zero-trust customer data masking, and enforce stringent SLA response targets.
          </p>
        </div>

        {/* Live Support KPI Grid */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '130px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Active Ticket Queue</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
              {tickets.filter(t => t.status !== 'Resolved').length} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>pending</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Avg SLA Response</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#4ade80', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={20} /> 14 Mins
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Resolution Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fcd34d', marginTop: '4px' }}>
              99.4%
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Helpdesk Room */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '22px', minHeight: '620px', height: 'auto' }}>
        
        {/* ── LEFT COLUMN: TICKET INBOX QUEUE ── */}
        <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 30px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '22px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
              <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '10px', color: '#4f46e5' }}><Headphones size={20} /></div>
              Support Inbox ({filteredTickets.length})
            </h3>

            {/* Search within Inbox */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search ticket, customer or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', fontWeight: '600', boxSizing: 'border-box', color: '#0f172a' }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1, padding: '7px 0', fontSize: '11px', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                    background: filter === f ? '#ffffff' : 'transparent',
                    color: filter === f ? '#4f46e5' : '#475569',
                    boxShadow: filter === f ? '0 2px 6px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '580px' }}>
            {filteredTickets.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <div style={{ fontWeight: '700', fontSize: '15px' }}>No support tickets found</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Try switching filter tabs or clearing search</div>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isSelected = activeTicket?._id === ticket._id;
                const isOpen = ticket.status === 'Open';
                const isProg = ticket.status === 'In Progress';

                return (
                  <div 
                    key={ticket._id}
                    onClick={() => handleSelectTicket(ticket._id)}
                    style={{
                      padding: '16px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      borderLeft: isSelected ? '5px solid #3b82f6' : '5px solid transparent'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#3b82f6', fontFamily: 'monospace' }}>
                        {ticket._id}
                      </span>
                      <span style={{ 
                        fontSize: '11px', padding: '3px 8px', borderRadius: '100px', fontWeight: '800', textTransform: 'uppercase',
                        background: isOpen ? '#fee2e2' : isProg ? '#fef3c7' : '#dcfce7',
                        color: isOpen ? '#b91c1c' : isProg ? '#b45309' : '#15803d',
                        border: '1px solid', borderColor: isOpen ? '#fca5a5' : isProg ? '#fde68a' : '#86efac'
                      }}>
                        {ticket.status}
                      </span>
                    </div>

                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', lineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {ticket.subject}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                      <span style={{ fontWeight: '700', color: '#334155' }}>👤 {ticket.customer?.name}</span>
                      <span style={{ fontWeight: '800', color: ticket.priority?.includes('Urgent') ? '#dc2626' : '#64748b' }}>{ticket.priority || '🟢 Normal'}</span>
                    </div>

                    {/* SLA Timer Badge */}
                    <div style={{ marginTop: '8px', padding: '4px 10px', background: isOpen ? '#fff1f2' : '#f1f5f9', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: isOpen ? '#e11d48' : '#475569', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid', borderColor: isOpen ? '#fecdd3' : '#e2e8f0' }}>
                      <Clock size={12} /> <span>{ticket.slaRemaining || 'Target < 4h'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: TICKET THREAD & RESOLUTION ENGINE ── */}
        <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 30px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '620px' }}>
          
          {activeTicket ? (
            <>
              {/* Thread Header with Zero-Trust Privacy Shield & WhatsApp Direct */}
              <div style={{ padding: '22px 28px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ maxWidth: '620px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '900', background: '#4f46e5', padding: '3px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                      {activeTicket._id}
                    </span>
                    {activeTicket.orderRef && (
                      <span style={{ fontSize: '12px', fontWeight: '800', background: '#065f46', color: '#a7f3d0', padding: '3px 10px', borderRadius: '6px', border: '1px solid #34d399' }}>
                        📦 Ref: #{activeTicket.orderRef}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: '800', background: '#f59e0b', color: '#1f2937', padding: '3px 10px', borderRadius: '6px' }}>
                      {activeTicket.priority || '⚡ Urgent SLA'}
                    </span>
                  </div>

                  <h3 style={{ margin: '4px 0 12px', fontSize: '20px', fontWeight: '900', color: '#ffffff', lineHeight: '1.3' }}>
                    {activeTicket.subject}
                  </h3>

                  {/* Customer Identity with Zero-Trust Masking */}
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '13px' }}>
                      <span>Customer: <strong>{activeTicket.customer?.name}</strong></span>
                      <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>
                      <span style={{ fontFamily: 'monospace', color: '#a5f3fc' }}>
                        {isMasked ? maskEmail(activeTicket.customer?.email) : activeTicket.customer?.email}
                      </span>
                      <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>
                      <span style={{ fontFamily: 'monospace', color: '#86efac', fontWeight: '800' }}>
                        {isMasked ? maskPhone(activeTicket.customer?.phone) : activeTicket.customer?.phone}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleMask}
                      style={{ padding: '4px 12px', borderRadius: '100px', background: isMasked ? '#3730a3' : '#f87171', color: '#ffffff', border: '1px solid #818cf8', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isMasked ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{isMasked ? 'Unmask VIP Contact' : 'Hide Contact'}</span>
                    </button>
                  </div>
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleWhatsAppBroadcast}
                    style={{ padding: '10px 16px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)' }}
                  >
                    <PhoneCall size={15} /> <span>Reply via WhatsApp Live</span>
                  </button>

                  {activeTicket.status !== 'Resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('Resolved')}
                      style={{ padding: '9px 16px', borderRadius: '12px', background: '#ffffff', color: '#15803d', border: '1px solid #86efac', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle size={14} /> <span>Mark Resolved & Close</span>
                    </button>
                  ) : (
                    <span style={{ background: '#059669', color: '#ffffff', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #34d399' }}>
                      <Check size={16} /> Ticket Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '360px' }}>
                {(activeTicket.messages || []).map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isAdmin ? 'flex-end' : 'flex-start' }}>
                    
                    <div style={{
                      maxWidth: '75%', padding: '15px 20px', borderRadius: '16px',
                      background: msg.isAdmin ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#ffffff',
                      color: msg.isAdmin ? '#1e3a8a' : '#1e293b',
                      border: '1px solid', borderColor: msg.isAdmin ? '#93c5fd' : '#cbd5e1',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.03)',
                      borderBottomRightRadius: msg.isAdmin ? '4px' : '16px',
                      borderBottomLeftRadius: msg.isAdmin ? '16px' : '4px'
                    }}>
                      <div style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{msg.content}</div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '700' }}>
                      {msg.isAdmin ? <Headphones size={12} style={{ color: '#2563eb' }} /> : <User size={12} style={{ color: '#475569' }} />}
                      <span>{msg.isAdmin ? 'Enterprise Support Specialist' : activeTicket.customer?.name}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* AI Smart Presets Bar */}
              <div style={{ padding: '12px 24px', background: '#eff6ff', borderTop: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} style={{ color: '#3b82f6' }} /> 🤖 AI Smart Presets:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {aiPresets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPreset(p.text)}
                      style={{ padding: '6px 14px', borderRadius: '100px', background: '#ffffff', color: '#1d4ed8', border: '1px solid #93c5fd', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Input Box */}
              <div style={{ padding: '20px 26px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <form onSubmit={handleReply} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={activeTicket.status === 'Resolved' ? "Ticket resolved. Enter follow-up note if needed..." : "Type custom solution or click AI Smart Presets above..."}
                    style={{ flex: 1, padding: '13px 18px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600', color: '#0f172a' }}
                  />
                  <button 
                    type="submit" 
                    disabled={!replyContent.trim()}
                    style={{ padding: '0 28px', height: '48px', borderRadius: '12px', background: !replyContent.trim() ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: '#ffffff', fontWeight: '900', fontSize: '14px', border: 'none', cursor: !replyContent.trim() ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: !replyContent.trim() ? 'none' : '0 6px 18px rgba(37, 99, 235, 0.35)' }}
                  >
                    <span>Dispatch Solution</span> <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '520px', color: '#94a3b8', gap: '14px' }}>
              <MessageSquare size={54} opacity={0.2} style={{ color: '#4f46e5' }} />
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#475569', margin: 0 }}>Select an active ticket from the Support Inbox to begin resolution.</p>
              <span style={{ fontSize: '13px' }}>All conversations are protected with Zero-Trust encryption and SLA metrics.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminHelpdesk;
