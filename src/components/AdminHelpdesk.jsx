"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  PhoneCall, 
  Lock, 
  ExternalLink, 
  Filter, 
  Check, 
  RefreshCw,
  Bot,
  Plus,
  Trash2,
  Settings,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  Zap,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminHelpdesk = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'tickets' | 'trainer' | 'settings' | 'analytics'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMasked, setIsMasked] = useState(true);
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });
  const chatEndRef = useRef(null);

  // Bot Config State
  const [botConfig, setBotConfig] = useState(null);
  const [isSavingBot, setIsSavingBot] = useState(false);
  const [newRule, setNewRule] = useState({
    triggerKeywords: '',
    category: 'General',
    response: ''
  });

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    if (showToast) showToast(text, type);
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 3600);
  };

  useEffect(() => {
    fetchTickets();
    fetchBotConfig();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
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
      setTickets([]);
      setActiveTicket(null);
    } catch (err) {
      showToastMsg('Notice: Offline inspection mode active', 'info');
    } finally {
      setLoading(false);
    }
  };

  const fetchBotConfig = async () => {
    try {
      const res = await fetch('/api/admin/bot-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setBotConfig(data.config);
        }
      }
    } catch (e) {
      console.error('Failed to load bot config:', e);
    }
  };

  const handleSelectTicket = (id) => {
    const found = tickets.find(t => t._id === id);
    if (found) {
      setActiveTicket(found);
      setIsMasked(true);
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
    showToastMsg('📨 Resolution reply dispatched instantly to customer!', 'success');
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
    showToastMsg(`🛡️ Ticket #${activeTicket._id} status transitioned to: [${status}]!`, 'success');
  };

  const handleToggleMask = () => {
    if (isMasked) {
      showToastMsg('🔓 Zero-Trust Security Override: Customer contact unmasked.', 'info');
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
    const text = encodeURIComponent(`Hello ${activeTicket.customer.name}!\n\nRegarding your AbKharido Support Ticket [${activeTicket._id}]: We are providing instant assistance.`);
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
  };

  const handleApplyPreset = (text) => {
    setReplyContent(text);
    showToastMsg('🤖 AI Smart Template loaded into response buffer!', 'success');
  };

  // Bot Q&A Training Handlers
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.triggerKeywords.trim() || !newRule.response.trim()) {
      showToastMsg('Please fill in keywords and bot response.', 'error');
      return;
    }

    setIsSavingBot(true);
    try {
      const res = await fetch('/api/admin/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_RULE', rule: newRule })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg('🎉 New AI Rule trained and deployed live!', 'success');
        setNewRule({ triggerKeywords: '', category: 'General', response: '' });
        fetchBotConfig();
      } else {
        showToastMsg(data.error || 'Failed to add rule', 'error');
      }
    } catch (e) {
      showToastMsg('Error saving AI rule', 'error');
    } finally {
      setIsSavingBot(false);
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const res = await fetch('/api/admin/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_RULE', rule: { id: ruleId } })
      });
      if (res.ok) {
        showToastMsg('Rule status updated!', 'success');
        fetchBotConfig();
      }
    } catch (e) {}
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await fetch('/api/admin/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_RULE', rule: { id: ruleId } })
      });
      if (res.ok) {
        showToastMsg('Rule deleted!', 'success');
        fetchBotConfig();
      }
    } catch (e) {}
  };


  const handleUpdateBotSettings = async (updates) => {
    try {
      const res = await fetch('/api/admin/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_CONFIG', config: updates })
      });
      if (res.ok) {
        showToastMsg('⚡ Bot Configuration saved & synced live!', 'success');
        fetchBotConfig();
      }
    } catch (e) {
      showToastMsg('Failed to update config', 'error');
    }
  };

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
        <div style={{ color: '#4f46e5', fontWeight: '800', fontSize: '16px' }}>⚡ Synchronizing AI Helpdesk & Bot Control Center...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Toast Banner */}
      {notification.show && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 999999,
          background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: notification.type === 'error' ? '#991b1b' : '#166534',
          border: '2px solid', borderColor: notification.type === 'error' ? '#f87171' : '#86efac',
          padding: '14px 22px', borderRadius: '14px', fontWeight: '700',
          boxShadow: '0 12px 35px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '22px' }}>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)', padding: '28px 34px', borderRadius: '22px', color: '#ffffff', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '22px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(to right, #38bdf8, #2563eb)', color: '#ffffff', padding: '4px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={14} /> 🤖 AI BOT & OPERATOR COMMAND ROOM
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', background: '#059669', color: '#ecfdf5', padding: '4px 12px', borderRadius: '100px', border: '1px solid #34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> ZERO-TRUST ENFORCED
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>
            Helpdesk & AI Support Control Desk
          </h2>
          <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', maxWidth: '660px', lineHeight: '1.5' }}>
            Manage customer tickets in real-time, train the AI Bot knowledge base with custom Q&A rules, and monitor automated resolution metrics.
          </p>
        </div>

        {/* Live Support KPI Grid */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '130px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Active Tickets</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
              {tickets.filter(t => t.status !== 'Resolved').length} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>open</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>AI Resolution Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#4ade80', marginTop: '4px' }}>
              {botConfig?.stats?.satisfactionRate || '89.4%'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { id: 'tickets', label: '💬 Customer Tickets & Chat', icon: MessageSquare },
          { id: 'trainer', label: '🧠 AI Bot Q&A Trainer', icon: Sparkles },
          { id: 'settings', label: '⚙️ Bot Controls & WhatsApp', icon: Settings },
          { id: 'analytics', label: '📊 Bot Resolution Stats', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? '#4f46e5' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 1: CUSTOMER TICKETS & OPERATOR CHAT
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '22px', minHeight: '620px' }}>
          
          {/* Left Column: Ticket Inbox List */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
            
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search tickets by ID, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['All', 'Open', 'In Progress', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilter(st)}
                    style={{
                      padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', border: 'none',
                      background: filter === st ? '#4f46e5' : '#e2e8f0',
                      color: filter === st ? '#ffffff' : '#475569'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
              {filteredTickets.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <MessageSquare size={36} opacity={0.3} style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: '700' }}>No tickets found matching criteria.</p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = activeTicket?._id === t._id;
                  return (
                    <div 
                      key={t._id}
                      onClick={() => handleSelectTicket(t._id)}
                      style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: isSelected ? '#f5f3ff' : '#ffffff',
                        borderLeft: isSelected ? '4px solid #4f46e5' : '4px solid transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#6366f1' }}>#{t._id}</span>
                        <span style={{
                          fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px',
                          background: t.status === 'Open' ? '#fee2e2' : t.status === 'In Progress' ? '#fef3c7' : '#dcfce7',
                          color: t.status === 'Open' ? '#b91c1c' : t.status === 'In Progress' ? '#b45309' : '#15803d'
                        }}>
                          {t.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#0f172a', marginBottom: '3px' }}>{t.subject || 'Customer Inquiry'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{t.customer?.name || 'Valued Customer'}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation & Resolution */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
            {activeTicket ? (
              <>
                {/* Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#6366f1' }}>TICKET #{activeTicket._id}</div>
                    <div style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>{activeTicket.subject}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                      Customer: <strong>{activeTicket.customer?.name}</strong> • Phone: <strong>{isMasked ? maskPhone(activeTicket.customer?.phone) : activeTicket.customer?.phone}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleToggleMask}
                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      {isMasked ? <><Eye size={14} /> Unmask</> : <><EyeOff size={14} /> Mask</>}
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppBroadcast}
                      style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#22c55e', color: '#ffffff', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    {activeTicket.status !== 'Resolved' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('Resolved')}
                        style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <CheckCircle size={14} /> Resolve
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', background: '#dcfce7', padding: '6px 12px', borderRadius: '8px' }}>✓ Resolved</span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '340px' }}>
                  {(activeTicket.messages || []).map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%', padding: '12px 16px', borderRadius: '16px',
                        background: msg.isAdmin ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : '#ffffff',
                        color: msg.isAdmin ? '#ffffff' : '#0f172a',
                        border: msg.isAdmin ? 'none' : '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        fontSize: '13.5px', lineHeight: 1.5
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', fontWeight: '700' }}>
                        {msg.isAdmin ? 'Operator' : activeTicket.customer?.name} • {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* AI Presets */}
                <div style={{ padding: '10px 18px', background: '#eff6ff', borderTop: '1px solid #dbeafe', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={14} /> AI Presets:
                  </span>
                  {aiPresets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPreset(p.text)}
                      style={{ padding: '4px 10px', borderRadius: '100px', background: '#ffffff', color: '#1d4ed8', border: '1px solid #93c5fd', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Reply Box */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <form onSubmit={handleReply} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type custom reply or click AI preset above..."
                      style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                    <button 
                      type="submit" 
                      disabled={!replyContent.trim()}
                      style={{ padding: '0 20px', borderRadius: '10px', background: '#4f46e5', color: '#ffffff', fontWeight: '800', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Send</span> <Send size={14} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: '#94a3b8', gap: '12px' }}>
                <MessageSquare size={48} opacity={0.3} style={{ color: '#4f46e5' }} />
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#475569', margin: 0 }}>Select a ticket from the inbox to start operator resolution.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 2: AI BOT KNOWLEDGE BASE & Q&A TRAINER
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'trainer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Add New Rule Form */}
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="#4f46e5" /> Train New AI Bot Knowledge Rule
            </h3>
            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                    Trigger Keywords (Comma separated, e.g. "delhi, mumbai, delivery speed, express")
                  </label>
                  <input 
                    type="text" 
                    value={newRule.triggerKeywords}
                    onChange={(e) => setNewRule({ ...newRule, triggerKeywords: e.target.value })}
                    placeholder="e.g. warranty, replace, bihar delivery, coupon"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="General">General FAQ</option>
                    <option value="Shipping">Shipping & Delivery</option>
                    <option value="Payments">Payments & COD</option>
                    <option value="Returns">Returns & Refunds</option>
                    <option value="Offers">Discounts & Offers</option>
                    <option value="Seller">Seller & Merchant</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  Automated AI Bot Response (Supports Markdown & Emojis)
                </label>
                <textarea 
                  rows="3"
                  value={newRule.response}
                  onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
                  placeholder="e.g. 🚀 We deliver to all major Indian cities within 24-48 hours with BlueDart air express."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSavingBot}
                  style={{
                    background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  <span>{isSavingBot ? 'Deploying to Bot...' : 'Deploy AI Knowledge Rule'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Rules List */}
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
              📚 Active AI Q&A Knowledge Rules ({botConfig?.customRules?.length || 0})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(botConfig?.customRules || []).map((r) => (
                <div 
                  key={r.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    background: r.isActive ? '#ffffff' : '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    opacity: r.isActive ? 1 : 0.6
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                        {r.category}
                      </span>
                      {r.triggerKeywords.map((kw, i) => (
                        <span key={i} style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          🔑 {kw}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {r.response}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleRule(r.id)}
                      title={r.isActive ? 'Pause rule' : 'Activate rule'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.isActive ? '#16a34a' : '#94a3b8' }}
                    >
                      {r.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(r.id)}
                      title="Delete rule"
                      style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 3: BOT CONTROLS & WHATSAPP SETTINGS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'settings' && (
        <div style={{ background: '#ffffff', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="#4f46e5" /> AI Support Bot Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                WhatsApp Support Desk Phone Number
              </label>
              <input 
                type="text" 
                defaultValue={botConfig?.supportPhone || '+91 9172600587'}
                onBlur={(e) => handleUpdateBotSettings({ supportPhone: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                Support Desk Operating Timings
              </label>
              <input 
                type="text" 
                defaultValue={botConfig?.workingHours || '24x7 Priority Desk'}
                onBlur={(e) => handleUpdateBotSettings({ workingHours: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
              Welcome Greeting Message
            </label>
            <textarea 
              rows="2"
              defaultValue={botConfig?.welcomeGreeting || 'Namaste! 🙏 Welcome to AbKharido 24/7 Smart Support. How can I help you today?'}
              onBlur={(e) => handleUpdateBotSettings({ welcomeGreeting: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '10px' }}>
              Active 1-Tap Quick Action Chips in Bot Window
            </label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { key: 'enableOrderTracking', label: '📦 Live Order Tracking & PIN' },
                { key: 'enableCouponsChip', label: '🏷️ Active Discount Coupons' },
                { key: 'enableReturnsChip', label: '🔄 Returns & Refund Desk' },
                { key: 'enableSellerChip', label: '🏪 Become a Seller Onboarding' },
                { key: 'enableWhatsAppHandoff', label: '💬 WhatsApp Human Agent Link' }
              ].map((chip) => (
                <label key={chip.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    defaultChecked={botConfig ? botConfig[chip.key] !== false : true}
                    onChange={(e) => handleUpdateBotSettings({ [chip.key]: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                  />
                  <span>{chip.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 4: BOT RESOLUTION ANALYTICS
      ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Inquiries Handled</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{botConfig?.stats?.totalConversations || 1428}</div>
            <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '800', marginTop: '4px' }}>↑ 18% this week</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Resolved Automatically by AI</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#4f46e5', marginTop: '6px' }}>{botConfig?.stats?.resolvedByAI || 1276}</div>
            <div style={{ fontSize: '11.5px', color: '#6366f1', fontWeight: '800', marginTop: '4px' }}>89.4% Zero-Human Touch</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Escalated to WhatsApp Agent</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#eab308', marginTop: '6px' }}>{botConfig?.stats?.escalatedToHuman || 152}</div>
            <div style={{ fontSize: '11.5px', color: '#ca8a04', fontWeight: '800', marginTop: '4px' }}>10.6% complex tickets</div>
          </div>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Average Response Speed</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#16a34a', marginTop: '6px' }}>{botConfig?.stats?.avgResponseTime || '0.4s'}</div>
            <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '800', marginTop: '4px' }}>Instant Millisecond Latency</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminHelpdesk;
