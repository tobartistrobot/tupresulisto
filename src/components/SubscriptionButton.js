'use client';
import { ShoppingCart } from 'lucide-react';

export default function SubscriptionButton({ userId, variantId = 'YOUR_VARIANT_ID', className = '' }) {

    const handleCheckout = () => {
        const checkoutUrl = `https://tupresulisto.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${userId}`;

        // Open Lemon Squeezy Overlay
        if (window.LemonSqueezy) {
            window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
            // Fallback if script didn't load
            window.open(checkoutUrl, '_blank');
        }
    };

    return (
        <button
            onClick={handleCheckout}
            className={`flex items-center gap-2 bg-[#7047EB] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5E3BC4] transition-all shadow-lg hover:shadow-[#7047EB]/30 ${className}`}
        >
            <ShoppingCart size={20} />
            <span>Suscribirse Ahora</span>
        </button>
    );
}
