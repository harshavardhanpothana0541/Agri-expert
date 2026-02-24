import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, Trash2, CheckCircle, CreditCard, Wallet, Banknote } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const { t } = useLanguage();
  const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'success'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');

  const tax = subtotal * 0.05;
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const total = subtotal + tax + deliveryFee;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const orderData = {
        user_id: user?.id || crypto.randomUUID(),
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          seller: item.seller
        })),
        subtotal,
        tax,
        delivery_fee: deliveryFee,
        total,
        delivery_address: address,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        order_status: 'placed'
      };

      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) throw error;

      clearCart();
      setStep('success');
      toast({ title: t('checkout.orderPlaced'), description: t('checkout.orderConfirm') });
    } catch (error) {
      console.error('Order error:', error);
      toast({ title: 'Error', description: 'Failed to place order', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <main className="pt-24 pb-12 px-4 max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-8">
            <CheckCircle className="w-20 h-20 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{t('checkout.orderPlaced')}</h1>
            <p className="text-muted-foreground mb-6">{t('checkout.orderConfirm')}</p>
            <Button onClick={() => navigate('/marketplace')} className="w-full">
              {t('checkout.continueShopping')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <button 
          onClick={() => step === 'cart' ? navigate('/marketplace') : setStep(step === 'payment' ? 'address' : 'cart')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">{t('checkout.title')}</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['cart', 'address', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s || ['cart', 'address', 'payment'].indexOf(step) > i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-1 ${['cart', 'address', 'payment'].indexOf(step) > i ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            {step === 'cart' && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-4">{t('marketplace.cart')} ({items.length})</h2>
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('marketplace.emptyCart')}</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                        <span className="text-3xl">{item.image}</span>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.seller}</p>
                          <p className="text-primary font-semibold">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {items.length > 0 && (
                  <Button className="w-full mt-6" onClick={() => setStep('address')}>
                    Continue to Address
                  </Button>
                )}
              </div>
            )}

            {step === 'address' && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-4">{t('checkout.deliveryAddress')}</h2>
                <div className="space-y-4">
                  <div>
                    <Label>{t('checkout.fullName')}</Label>
                    <Input
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label>{t('checkout.phone')}</Label>
                    <Input
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label>{t('checkout.address')}</Label>
                    <Input
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('checkout.city')}</Label>
                      <Input
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>{t('checkout.pincode')}</Label>
                      <Input
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        placeholder="PIN Code"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  onClick={() => setStep('payment')}
                  disabled={!address.fullName || !address.phone || !address.address || !address.city || !address.pincode}
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {step === 'payment' && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-4">{t('checkout.paymentMethod')}</h2>
                <div className="space-y-3">
                  {[
                    { id: 'cod', label: t('checkout.cod'), icon: Banknote },
                    { id: 'upi', label: t('checkout.upi'), icon: Wallet },
                    { id: 'card', label: t('checkout.card'), icon: CreditCard }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id as any)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                        paymentMethod === id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <Button 
                  className="w-full mt-6" 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? t('common.loading') : t('checkout.placeOrder')}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="glass-card rounded-2xl p-6 h-fit">
            <h2 className="font-semibold text-lg mb-4">{t('checkout.orderSummary')}</h2>
            <div className="space-y-3 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('checkout.tax')}</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('checkout.delivery')}</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('checkout.total')}</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
