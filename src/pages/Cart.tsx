import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, ArrowRight, ShoppingBag, CheckCircle, CreditCard, 
  Smartphone, ShieldCheck, Download, Truck, Tag, Printer,
  AlertCircle, Sparkles, Check, Clock, Box
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { Order, OrderItem, CustomerDetails } from '../types';
import { playHoverSound, playSelectSound, playEquipSound, playCancelSound } from '../lib/gameSound';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useStore();
  const { createOrder } = useSiteStore();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'mpesa'>('card');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState('');

  // Customer shipping info
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    email: '',
    address: '',
    city: '',
    country: 'United States',
    postalCode: '',
    phone: ''
  });

  // Billing address match toggle
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState('');

  // Card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: ''
  });

  // M-Pesa state
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pushing' | 'verified'>('idle');

  // PayPal state
  const [paypalLinked, setPaypalLinked] = useState(false);

  // Pricing calculations
  const rawSubtotal = getCartTotal();
  const discountAmount = discountApplied ? rawSubtotal * 0.15 : 0;
  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  
  const isAllDigital = cart.length > 0 && cart.every(i => i.category === 'Digital');
  const baseShipping = isAllDigital ? 0 : subtotal >= 50 ? 0 : 12;
  const shippingFee = isAllDigital ? 0 : shippingMethod === 'express' ? baseShipping + 8 : baseShipping;
  const total = subtotal + shippingFee;

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    playSelectSound();
    const clean = discountCode.trim().toUpperCase();
    if (clean === 'ZEJI10' || clean === 'MANGA' || clean === 'CYBER') {
      setDiscountApplied(true);
      setDiscountError('');
      playEquipSound();
    } else {
      setDiscountError('Invalid code. Use "ZEJI10" for 15% off operative discount.');
    }
  };

  const handleFillDemoCard = () => {
    playEquipSound();
    setCardDetails({
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '888',
      nameOnCard: customer.name || 'OPERATOR ZEJI'
    });
    if (!customer.name) {
      setCustomer({
        name: 'Operator Zeji',
        email: 'operator@zeji-manga.jp',
        address: '104 Shibuya Crossing, Studio B',
        city: 'Tokyo',
        country: 'Japan',
        postalCode: '150-0002',
        phone: '+81 90-1234-5678'
      });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    playSelectSound();

    if (!customer.name.trim() || !customer.email.trim() || !customer.address.trim()) {
      setValidationError('Please complete all required shipping fields: Full Name, Email, and Street Address.');
      playCancelSound();
      return;
    }

    // Basic email check
    if (!customer.email.includes('@') || !customer.email.includes('.')) {
      setValidationError('Please provide a valid transmission email address.');
      playCancelSound();
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber.trim() || !cardDetails.expiry.trim() || !cardDetails.cvc.trim()) {
        setValidationError('Please enter your card number, expiry, and CVC or click "AUTOFILL TEST CARD".');
        playCancelSound();
        return;
      }
    }

    if (paymentMethod === 'mpesa') {
      const phoneToUse = mpesaPhone.trim() || customer.phone?.trim();
      if (!phoneToUse) {
        setValidationError('Please enter an M-Pesa mobile phone number to receive the STK PIN prompt.');
        playCancelSound();
        return;
      }
      setMpesaStatus('pushing');
    }

    setIsSubmitting(true);

    try {
      // Realistic cryptographic settlement simulation
      await new Promise(res => setTimeout(res, paymentMethod === 'mpesa' ? 2200 : 1400));

      if (paymentMethod === 'mpesa') {
        setMpesaStatus('verified');
      }

      const orderItems: OrderItem[] = cart.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        category: i.category,
        image: i.image,
        downloadUrl: i.downloadUrl || 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg'
      }));

      const newOrder: Order = {
        id: `ZEJI-ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
        createdAt: new Date().toISOString(),
        customer: {
          ...customer,
          phone: customer.phone || mpesaPhone
        },
        items: orderItems,
        subtotal,
        shippingFee,
        total,
        paymentMethod,
        status: 'processing'
      };

      await createOrder(newOrder);
      playEquipSound();
      setCompletedOrder(newOrder);
      clearCart();
    } catch (err) {
      console.error('Order error:', err);
      setValidationError('Encountered an issue processing order settlement. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Order Confirmed / Receipt Screen
  if (completedOrder) {
    const hasDigital = completedOrder.items.some(i => i.category === 'Digital');

    return (
      <div className="max-w-[850px] mx-auto px-4 sm:px-8 py-12 md:py-16 relative z-10 font-sans">
        <div 
          className="bg-black border-2 border-white p-6 sm:p-10 shadow-[8px_8px_0_#00FF66] text-white relative overflow-hidden"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))'
          }}
        >
          {/* Halftone screentone backdrop */}
          <div className="absolute inset-0 manga-screentone-neon opacity-10 pointer-events-none"></div>

          {/* Stamp Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-white relative z-10">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-[#00FF66] text-black">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <span className="text-[10px] font-mono text-[#00FF66] font-bold block uppercase tracking-widest">
                  CONFIRMATION MANIFEST // 支給確定
                </span>
                <h1 className="text-2xl sm:text-3xl font-game font-black text-white uppercase tracking-tight">
                  REQUISITION AUTHORIZED
                </h1>
              </div>
            </div>

            <div className="text-right font-mono text-xs hidden sm:block">
              <span className="text-zinc-400 block">ORDER ID // 注文番号</span>
              <span className="text-[#00FF66] font-bold text-sm">{completedOrder.id}</span>
            </div>
          </div>

          {/* Interactive Fulfillment Timeline */}
          <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 relative z-10">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">
              <span className="text-[#00FF66] font-bold">LOGISTICS TRACKING STATUS</span>
              <span>CARRIER DISPATCH ESTIMATE: 24-48H</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
              <div className="p-2 bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66] font-bold">
                1. PAID ✓
              </div>
              <div className="p-2 bg-[#00FF66] text-black font-bold animate-pulse">
                2. PACKING
              </div>
              <div className="p-2 bg-black border border-zinc-800 text-zinc-500">
                3. TRANSIT
              </div>
              <div className="p-2 bg-black border border-zinc-800 text-zinc-500">
                4. DELIVERED
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-zinc-950 border border-zinc-800 font-mono text-xs relative z-10">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Recipient // 宛先:</span>
              <span className="text-white font-bold block text-sm">{completedOrder.customer.name}</span>
              <span className="text-zinc-400 block">{completedOrder.customer.email}</span>
              <span className="text-zinc-400 block">{completedOrder.customer.address}, {completedOrder.customer.city}</span>
              <span className="text-zinc-500 block">{completedOrder.customer.country} {completedOrder.customer.postalCode}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Payment & Logistics // 決済区分:</span>
              <span className="text-[#00FF66] font-bold block uppercase">
                {completedOrder.paymentMethod.toUpperCase()} &bull; PAID (${completedOrder.total.toFixed(2)})
              </span>
              <span className="text-zinc-400 block mt-1">SHIPPING: {completedOrder.shippingFee === 0 ? 'FREE TACTICAL CARRIER' : `$${completedOrder.shippingFee.toFixed(2)} COURIER`}</span>
              <span className="text-zinc-500 text-[10px] block mt-0.5">{new Date(completedOrder.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Itemized Manifest */}
          <div className="mb-6 relative z-10">
            <h3 className="font-game font-black text-xs uppercase tracking-wider text-[#00FF66] mb-3">
              ACQUIRED GEAR ITEMS // 支給物品一覧
            </h3>
            <div className="divide-y divide-zinc-900 border-y border-zinc-800">
              {completedOrder.items.map(item => (
                <div key={item.productId} className="py-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] text-[10px] font-bold">
                      x{item.quantity}
                    </span>
                    <span className="text-white font-bold">{item.name}</span>
                    <span className="text-zinc-500 text-[10px]">({item.category})</span>
                  </div>
                  <span className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Access Download Link if applicable */}
          {hasDigital && (
            <div className="mb-8 p-4 bg-black border-2 border-[#00FF66] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0_#ffffff] relative z-10">
              <div>
                <span className="text-xs font-game font-bold text-[#00FF66] flex items-center gap-2">
                  <Download className="w-4 h-4" /> DIGITAL ASSETS AVAILABLE FOR IMMEDIATE DOWNLOAD
                </span>
                <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                  Lossless 24-bit audio stems & patches have been unlocked for your order.
                </span>
              </div>
              <a
                href="https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg"
                download="ZEJI_DIGITAL_RELEASE.ogg"
                onClick={playEquipSound}
                className="px-4 py-2 bg-[#00FF66] text-black font-game font-black text-xs uppercase tracking-wider hover:bg-white transition-colors border border-black shrink-0"
              >
                DOWNLOAD NOW
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-zinc-800 relative z-10">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-black border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT RECEIPT MANIFEST</span>
            </button>

            <Link
              to="/store"
              onMouseEnter={playHoverSound}
              onClick={playSelectSound}
              className="px-8 py-3.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-2 border-black shadow-[3px_3px_0_#ffffff] hover:shadow-[3px_3px_0_#00FF66]"
            >
              <span>RETURN TO ARMORY // 兵站に戻る</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div className="max-w-[650px] mx-auto px-4 sm:px-8 py-20 text-center relative z-10 font-sans">
        <div 
          className="bg-black border-2 border-white p-10 sm:p-14 shadow-[6px_6px_0_#00FF66] relative overflow-hidden"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))'
          }}
        >
          <ShoppingBag className="w-12 h-12 text-[#00FF66] mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-game font-black text-white uppercase mb-2">
            ARMORY REQUISITION DECK IS EMPTY
          </h2>
          <p className="text-xs font-mono text-zinc-400 mb-6 max-w-sm mx-auto">
            No gear, vinyl releases, or tactical audio stems selected. Select items from the official armory to equip.
          </p>
          <Link
            to="/store"
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#ffffff] hover:shadow-[3px_3px_0_#00FF66]"
          >
            <span>BROWSE OFFICIAL GEAR // 装備選択</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Active Checkout Form Screen
  return (
    <div className="max-w-[1340px] mx-auto px-4 sm:px-8 py-8 md:py-14 relative z-10 font-sans w-full pb-24">
      
      {/* Manga Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-black text-[#00FF66] border-2 border-[#00FF66] font-mono text-xs font-black shadow-[2px_2px_0_#ffffff]">
              第漆話 // 07
            </span>
            <span className="text-xs font-mono text-zinc-400">
              ARMORY CHECKOUT & LOGISTICS
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase flex items-center gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 兵站精算 】</span>
            CHECKOUT MANIFEST
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-[#00FF66]" />
          <span>256-BIT ENCRYPTED SETTLEMENT</span>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mb-6 p-4 bg-red-950/80 border-2 border-red-500 text-white font-mono text-xs flex items-center gap-3 shadow-[4px_4px_0_#000000] animate-shake">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <span className="text-red-400 font-bold block">【 警告 】 VALIDATION DISPATCH ERROR:</span>
            <span>{validationError}</span>
          </div>
          <button 
            onClick={() => setValidationError(null)}
            className="text-xs px-2 py-1 bg-black text-red-400 hover:text-white border border-red-500"
          >
            DISMISS
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cart Items, Delivery Information & Freight */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Cart Item Cards Styled as Manga Panels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-zinc-800">
              <span className="text-xs font-game font-black text-[#00FF66] uppercase tracking-wider">
                SELECTED ITEMS ({cart.reduce((tot, i) => tot + i.quantity, 0)})
              </span>
              <button 
                onClick={() => {
                  playSelectSound();
                  clearCart();
                }}
                className="text-[11px] font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase"
              >
                CLEAR ALL // 全削除
              </button>
            </div>

            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-black border-2 border-white hover:border-[#00FF66] transition-all shadow-[4px_4px_0_#000000] relative overflow-hidden group"
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 border-2 border-white bg-black shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-black text-[#00FF66] border border-[#00FF66]">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-game font-black text-white uppercase truncate">
                    {item.name}
                  </h3>
                  <span className="text-sm font-mono font-bold text-[#00FF66] block mt-1">
                    ${item.price.toFixed(2)} USD
                  </span>
                </div>

                {/* Quantity Control & Remove */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center border-2 border-white bg-black text-white">
                    <button
                      onClick={() => {
                        playSelectSound();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                      className="px-2.5 py-1 text-xs font-mono font-bold hover:bg-white hover:text-black transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-mono font-black text-[#00FF66]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        playSelectSound();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                      className="px-2.5 py-1 text-xs font-mono font-bold hover:bg-white hover:text-black transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      playSelectSound();
                      removeFromCart(item.id);
                    }}
                    className="p-2 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Shipping & Recipient Details Form */}
          <div 
            className="p-6 bg-black border-2 border-white shadow-[6px_6px_0_#00FF66] relative"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-zinc-800">
              <h3 className="font-game font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>01 // SHIPPING RECIPIENT INFORMATION</span>
                <span className="text-[10px] font-mono text-[#00FF66]">配送先情報</span>
              </h3>

              <button
                type="button"
                onClick={handleFillDemoCard}
                className="text-[10px] font-mono font-bold text-[#00FF66] hover:text-white px-2 py-1 border border-[#00FF66] hover:bg-[#00FF66] hover:text-black transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>DEMO AUTOFILL // 自動入力</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">FULL NAME *</label>
                <input
                  required
                  type="text"
                  placeholder="Commander Jane Doe"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">EMAIL ADDRESS (FOR RECEIPT & ASSETS) *</label>
                <input
                  required
                  type="email"
                  placeholder="jane@sector.io"
                  value={customer.email}
                  onChange={e => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">STREET ADDRESS *</label>
                <input
                  required
                  type="text"
                  placeholder="104 Cyber St, Unit 7B"
                  value={customer.address}
                  onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">CITY *</label>
                <input
                  required
                  type="text"
                  placeholder="Neo Tokyo / Nairobi / London"
                  value={customer.city}
                  onChange={e => setCustomer({ ...customer, city: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">COUNTRY / REGION *</label>
                <input
                  required
                  type="text"
                  placeholder="United States / Kenya / Japan"
                  value={customer.country}
                  onChange={e => setCustomer({ ...customer, country: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">POSTAL / ZIP CODE</label>
                <input
                  type="text"
                  placeholder="90210"
                  value={customer.postalCode}
                  onChange={e => setCustomer({ ...customer, postalCode: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">PHONE NUMBER (FOR CARRIER / M-PESA)</label>
                <input
                  type="tel"
                  placeholder="+1 555-019-2834 or +254 712 345 678"
                  value={customer.phone}
                  onChange={e => {
                    setCustomer({ ...customer, phone: e.target.value });
                    if (!mpesaPhone) setMpesaPhone(e.target.value);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>
            </div>

            {/* Billing Address Toggle */}
            <div className="mt-4 pt-3 border-t border-zinc-900 font-mono text-xs">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={sameAsBilling} 
                  onChange={e => setSameAsBilling(e.target.checked)}
                  className="accent-[#00FF66] w-4 h-4 cursor-pointer"
                />
                <span>Billing address matches shipping address</span>
              </label>

              {!sameAsBilling && (
                <div className="mt-3">
                  <label className="block text-zinc-400 mb-1">BILLING ADDRESS</label>
                  <input
                    type="text"
                    placeholder="Billing street address"
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Logistics Freight Tier Selection */}
          {!isAllDigital && (
            <div 
              className="p-6 bg-black border-2 border-white shadow-[6px_6px_0_#00FF66] relative font-mono text-xs"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
              }}
            >
              <h3 className="font-game font-black text-sm uppercase tracking-wider text-white mb-4 pb-2 border-b-2 border-zinc-800 flex items-center justify-between">
                <span>02 // FREIGHT & DISPATCH SPEED</span>
                <span className="text-[10px] text-[#00FF66]">配送便選択</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setShippingMethod('standard');
                  }}
                  className={`p-4 border-2 text-left transition-all relative ${
                    shippingMethod === 'standard'
                      ? 'border-[#00FF66] bg-zinc-950 shadow-[3px_3px_0_#ffffff]'
                      : 'border-zinc-800 bg-black hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white uppercase">TACTICAL GROUND</span>
                    <span className="text-[#00FF66] font-bold">
                      {subtotal >= 50 ? 'FREE' : '$12.00'}
                    </span>
                  </div>
                  <span className="text-zinc-400 text-[11px] block">Estimated 3-5 business days delivery. Includes tracking ID.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setShippingMethod('express');
                  }}
                  className={`p-4 border-2 text-left transition-all relative ${
                    shippingMethod === 'express'
                      ? 'border-[#00FF66] bg-zinc-950 shadow-[3px_3px_0_#ffffff]'
                      : 'border-zinc-800 bg-black hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white uppercase">AERIAL PRIORITY</span>
                    <span className="text-[#00FF66] font-bold">
                      {subtotal >= 50 ? '$8.00' : '$20.00'}
                    </span>
                  </div>
                  <span className="text-zinc-400 text-[11px] block">Express 24-48h dispatch. High priority handling.</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Order Summary & Payment Method */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Order Summary Manifest */}
          <div 
            className="p-6 bg-black border-2 border-white shadow-[6px_6px_0_#00FF66] relative text-white"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            <h3 className="font-game font-black text-sm uppercase tracking-wider text-white mb-4 pb-2 border-b-2 border-zinc-800 flex items-center justify-between">
              <span>03 // REQUISITION TOTAL</span>
              <span className="text-[10px] font-mono text-[#00FF66]">総計明細</span>
            </h3>

            {/* Discount Code Input */}
            <form onSubmit={handleApplyDiscount} className="mb-4">
              <label className="block text-zinc-400 text-[10px] font-mono mb-1">PROMOTIONAL CODE // 割引コード</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. ZEJI10)"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] px-3 py-2 text-xs font-mono uppercase text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black hover:bg-[#00FF66] font-mono font-bold text-xs uppercase transition-colors"
                >
                  APPLY
                </button>
              </div>
              {discountApplied && (
                <span className="text-[10px] font-mono text-[#00FF66] block mt-1">
                  ✓ 15% VIP OPERATIVE DISCOUNT APPLIED
                </span>
              )}
              {discountError && (
                <span className="text-[10px] font-mono text-red-400 block mt-1">
                  {discountError}
                </span>
              )}
            </form>

            <div className="space-y-2 py-3 border-y border-zinc-900 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>SUBTOTAL:</span>
                <span className="text-white">${rawSubtotal.toFixed(2)}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-[#00FF66]">
                  <span>DISCOUNT (15%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>LOGISTICS FREIGHT ({shippingMethod === 'express' ? 'EXPRESS' : 'STANDARD'}):</span>
                </span>
                <span className={shippingFee === 0 ? 'text-[#00FF66] font-bold' : 'text-white'}>
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="py-4 flex justify-between items-baseline font-mono">
              <span className="text-sm font-game font-black uppercase text-white">
                TOTAL DUE // 請求総額:
              </span>
              <span className="text-2xl font-black text-[#00FF66]">
                ${total.toFixed(2)} USD
              </span>
            </div>

            {/* Payment Options Selection */}
            <div className="pt-2">
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                04 // SELECT PAYMENT GATEWAY
              </label>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: 'card', label: 'CARD', icon: CreditCard },
                  { id: 'paypal', label: 'PAYPAL', icon: ShieldCheck },
                  { id: 'mpesa', label: 'M-PESA', icon: Smartphone }
                ].map(p => {
                  const Icon = p.icon;
                  const isSelected = paymentMethod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        playSelectSound();
                        setPaymentMethod(p.id as any);
                      }}
                      className={`p-3 border-2 flex flex-col items-center justify-center gap-1 text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-[2px_2px_0_#00FF66]'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Payment Details Fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 p-3.5 bg-zinc-950 border border-zinc-800 font-mono text-xs mb-4">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>CREDIT / DEBIT CARD</span>
                    <button
                      type="button"
                      onClick={handleFillDemoCard}
                      className="text-[#00FF66] hover:underline"
                    >
                      Use Demo Card
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">CARD NUMBER</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      value={cardDetails.cardNumber}
                      onChange={e => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">EXPIRY (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        maxLength={5}
                        value={cardDetails.expiry}
                        onChange={e => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                        className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">CVC CODE</label>
                      <input
                        type="password"
                        placeholder="888"
                        maxLength={4}
                        value={cardDetails.cvc}
                        onChange={e => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400 mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">PayPal Express Gateway</span>
                    <span className="text-[10px] text-[#00FF66]">Instant Auth</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Authorize through your PayPal wallet or connected balance.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playEquipSound();
                      setPaypalLinked(!paypalLinked);
                    }}
                    className={`w-full py-2 border font-mono text-xs font-bold transition-all ${
                      paypalLinked 
                        ? 'border-[#00FF66] bg-[#00FF66]/10 text-[#00FF66]' 
                        : 'border-zinc-700 bg-black text-white hover:border-white'
                    }`}
                  >
                    {paypalLinked ? '✓ PAYPAL ACCOUNT LINKED' : 'CONNECT PAYPAL ACCOUNT'}
                  </button>
                </div>
              )}

              {paymentMethod === 'mpesa' && (
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 font-mono text-xs mb-4 space-y-2">
                  <span className="text-[#00FF66] block font-bold">M-Pesa STK Instant Push:</span>
                  <p className="text-zinc-400 text-[11px]">
                    Enter your Safaricom mobile phone number below. An encrypted prompt will appear on your screen to enter your M-Pesa PIN.
                  </p>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">M-PESA MOBILE NUMBER</label>
                    <input
                      type="tel"
                      placeholder="e.g. 254712345678 or 0712345678"
                      value={mpesaPhone || customer.phone || ''}
                      onChange={e => setMpesaPhone(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                    />
                  </div>
                  {mpesaStatus === 'pushing' && (
                    <div className="text-[10px] text-[#00FF66] flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      <span>DISPATCHING STK PUSH TO HANDSET... ENTER PIN NOW.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                onMouseEnter={playHoverSound}
                className="w-full py-4 bg-[#00FF66] hover:bg-white text-black font-game font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0_#ffffff] hover:shadow-[4px_4px_0_#00FF66] disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"></span>
                    SETTLING ENCRYPTED PAYMENT...
                  </span>
                ) : (
                  <>
                    <span>AUTHORIZE REQUISITION // 決済確定 (${total.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-zinc-500 mt-3">
                <span>30-DAY OPERATIVE GUARANTEE</span>
                <span>&bull;</span>
                <span>TRACKED PHYSICAL LOGISTICS</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
