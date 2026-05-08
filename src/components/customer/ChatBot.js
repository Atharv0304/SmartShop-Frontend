import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const QUICK_OPTIONS = {
  CUSTOMER: [
    { label: '📦 Track my order',    msg: 'Show me the status of my order' },
    { label: '❌ Cancel order',        msg: 'I want to cancel my order' },
    { label: '📋 My recent orders',   msg: 'Show me my recent orders' },
    { label: '😞 File a complaint',   msg: 'I want to file a complaint about my order.' },
    { label: '💳 Payment issue',       msg: 'I have a payment issue with my order.' },
    { label: '🚴 Delivery charge?',    msg: 'How is the delivery charge calculated?' },
    { label: '🔐 OTP not received',    msg: 'I did not receive my delivery OTP.' },
    { label: '🔄 Return / Refund',     msg: 'How do I return a product or get a refund?' },
  ],
  SHOPKEEPER: [
    { label: '📋 My shop orders',      msg: 'Show me my recent shop orders' },
    { label: '📦 Add products',        msg: 'How do I add new products to my shop?' },
    { label: '🚴 Delivery partners',   msg: 'How do I connect with delivery partners?' },
    { label: '📊 View sales',          msg: 'How can I see my sales and revenue stats?' },
    { label: '🔔 Order notifications', msg: 'Why am I not receiving order notifications?' },
    { label: '⏰ Shop timings',        msg: 'How do I update my shop opening and closing time?' },
    { label: '💰 UPI / Payments',      msg: 'How do I set up UPI payments for my shop?' },
    { label: '🗑️ Remove product',      msg: 'How do I delete or update an existing product?' },
  ],
  DELIVERY_BOY: [
    { label: '📋 My deliveries',       msg: 'Show me my assigned deliveries' },
    { label: '🗺️ How to navigate',     msg: 'How do I navigate to the customer location?' },
    { label: '🔐 Shop OTP issue',       msg: 'What do I do if the shopkeeper OTP is wrong?' },
    { label: '📵 Customer not picking', msg: 'The customer is not picking up the phone. What should I do?' },
    { label: '💰 How do I get paid',    msg: 'How does the payment and earnings work?' },
    { label: '🏪 Connect to a shop',    msg: 'How do I send a connection request to a shop?' },
    { label: '🆘 Order delay',          msg: 'My delivery is getting delayed. What should I do?' },
    { label: '🚦 Go online/offline',    msg: 'How do I toggle my availability status?' },
  ],
};

const ROLE_CONFIG = {
  CUSTOMER: {
    greeting: "Hi! 👋 I'm **SmartBot** — connected to your SmartStore account!\n\nI can track orders, cancel orders, and answer questions using **real data from your account**.",
    systemPrompt:
      'You are SmartBot, an AI assistant for SmartStore customers. You have REAL database access. ' +
      'When database data is provided to you in [REAL DATABASE DATA], use it EXACTLY to answer — never make up order IDs, amounts, or statuses. ' +
      'SmartStore facts: Delivery ₹5/km, OTP-verified delivery, pickup & home delivery options, Cash/Online payment. ' +
      'Order statuses: PENDING → CONFIRMED → PREPARING → LOOKING_FOR_DELIVERY → DELIVERY_ACCEPTED → PICKED → DELIVERED. ' +
      'For pickup: PENDING → CONFIRMED → READY_FOR_PICKUP → DELIVERED. ' +
      'Be short, friendly, empathetic. Use emojis. Respond in the language the user writes in.',
    headerLabel: 'Customer Support • Live Data',
    color: 'from-blue-500 to-purple-600',
    border: 'border-blue-500',
  },
  SHOPKEEPER: {
    greeting: "Hello! 🏪 I'm **SmartBot** — connected to your shop data!\n\nI can show your orders, answer questions, and help manage your shop using **real data**.",
    systemPrompt:
      'You are SmartBot, an AI assistant for SmartStore shopkeepers. You have REAL database access. ' +
      'When database data is provided in [REAL DATABASE DATA], use it EXACTLY — never invent order or revenue data. ' +
      'SmartStore shopkeeper flow: Customer orders → Shopkeeper confirms → Marks ready → Delivery boy picks up → Delivers with OTP. ' +
      'For pickup orders: Confirm → Mark ready → Customer shows OTP at shop. ' +
      'Be short, practical, actionable. Use emojis. Respond in the language the user writes in.',
    headerLabel: 'Shop Assistant • Live Data',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500',
  },
  DELIVERY_BOY: {
    greeting: "Hey! 🏍️ I'm **SmartBot** — your delivery guide with live data!\n\nI can show your assigned deliveries and answer any rider questions.",
    systemPrompt:
      'You are SmartBot, an AI assistant for SmartStore delivery partners. You have REAL database access. ' +
      'When database data is provided in [REAL DATABASE DATA], use it EXACTLY. ' +
      'Rider flow: Accept → Go to shop → Give Shop OTP → Pick up → Customer gives Delivery OTP → Done. Earnings: ₹5/km. ' +
      'Be short, motivating, practical. Use emojis. Respond in the language the user writes in.',
    headerLabel: 'Rider Assistant • Live Data',
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-500',
  },
};

const ChatBot = ({ role = 'CUSTOMER' }) => {
  const config    = ROLE_CONFIG[role] || ROLE_CONFIG.CUSTOMER;
  const quickOpts = QUICK_OPTIONS[role] || QUICK_OPTIONS.CUSTOMER;

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: config.greeting }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [pulse, setPulse]       = useState(false);
  const [followUp, setFollowUp] = useState(null); // pending intent from previous turn

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  useEffect(() => {
    if (!open) {
      const id = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 1000); }, 8000);
      return () => clearInterval(id);
    }
  }, [open]);

  const addBot = (content) => setMessages(prev => [...prev, { role: 'assistant', content }]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(1).slice(-10).map(m => ({ role: m.role, content: m.content }));

      const res = await api.post('/api/chat/smart', {
        message:       userText,
        role,
        systemPrompt:  config.systemPrompt,
        history,
        intentHint:    followUp || null,
        pendingOrderId: followUp && followUp.startsWith('CANCEL_REASON:')
                          ? followUp.split(':')[1] : null,
        customerId:    localStorage.getItem('customerId')    || null,
        shopId:        localStorage.getItem('shopId')        || null,
        deliveryBoyId: localStorage.getItem('deliveryBoyId') || null,
      });

      addBot(res.data.reply);
      // If backend needs a follow-up (e.g. waiting for order ID), store the intent
      setFollowUp(res.data.followUp || null);

    } catch {
      addBot("Sorry, I'm having trouble right now. Please try again! 🙏");
      setFollowUp(null);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderMessage = (content) =>
    content.split('\n').map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
    });

  const grad   = config.color;
  const border = config.border;

  return (
    <>
      {/* Floating button */}
      <button
        id="smartbot-toggle"
        onClick={() => { setOpen(p => !p); if (open) setFollowUp(null); }}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
          open ? 'bg-red-500 hover:bg-red-600 scale-110' : `bg-gradient-to-br ${grad} hover:scale-110`
        } ${pulse && !open ? 'animate-bounce' : ''}`}
        style={{ boxShadow: open ? '0 8px 32px rgba(239,68,68,0.4)' : '0 8px 32px rgba(99,102,241,0.5)' }}
      >
        {open ? '✕' : '🤖'}
        {!open && <span className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />}
      </button>

      {/* Chat window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-1.5rem)] transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100" style={{ maxHeight: '85vh' }}>

          {/* Header */}
          <div className={`bg-gradient-to-r ${grad} px-5 py-4 flex items-center gap-3 flex-shrink-0`}>
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">🤖</div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">SmartBot</p>
              <p className="text-white/70 text-xs">{config.headerLabel}</p>
            </div>
            <button onClick={() => { setOpen(false); setFollowUp(null); }}
              className="text-white/70 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">✕</button>
          </div>

          {/* followUp indicator */}
          {followUp && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 font-medium flex items-center gap-2">
              <span className="animate-pulse">🔗</span>
              {followUp === 'CANCEL_ORDER' && 'Please enter your Order ID to cancel…'}
              {followUp === 'TRACK_ORDER'  && 'Please enter your Order ID to track…'}
              {followUp?.startsWith('CANCEL_REASON:') && 'Select a cancellation reason below or type your own…'}
            </div>
          )}

          {/* Cancel reason quick-select buttons */}
          {followUp?.startsWith('CANCEL_REASON:') && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex-shrink-0">
              <p className="text-xs font-bold text-red-600 mb-2">Why are you cancelling?</p>
              <div className="flex flex-wrap gap-1.5">
                {['Changed my mind','Wrong items ordered','Found better price','Order taking too long'].map((reason, i) => (
                  <button key={i}
                    onClick={() => sendMessage(reason)}
                    disabled={loading}
                    className="text-xs bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-full transition-all font-medium shadow-sm whitespace-nowrap disabled:opacity-50">
                    {['😕','📦','💰','⏰'][i]} {reason}
                  </button>
                ))}
                <button
                  onClick={() => sendMessage('Other reason')}
                  disabled={loading}
                  className="text-xs bg-white border border-gray-200 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-full transition-all font-medium shadow-sm disabled:opacity-50">
                  ✏️ Other
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: '200px', maxHeight: '280px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1`}>🤖</div>
                )}
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? `bg-gradient-to-br ${grad} text-white rounded-br-sm`
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                }`}>
                  {renderMessage(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`w-7 h-7 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0`}>🤖</div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick options */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {quickOpts.map((opt, i) => (
                <button key={i} onClick={() => sendMessage(opt.msg)} disabled={loading}
                  className={`text-xs bg-gray-50 border border-gray-200 hover:${border} text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-full transition-all font-medium shadow-sm whitespace-nowrap disabled:opacity-50`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <textarea ref={inputRef} rows={1} value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={followUp ? 'Enter your Order ID (e.g. 42)…' : 'Ask me anything or use quick actions…'}
                className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 py-1"
                style={{ maxHeight: '80px' }} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  input.trim() && !loading
                    ? `bg-gradient-to-br ${grad} text-white shadow-md hover:scale-110`
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                {loading
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                }
              </button>
            </div>
            <p className="text-center text-gray-300 text-[10px] mt-1.5">
              🔗 Connected to live SmartStore database • Powered by Llama 3.1
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default ChatBot;
