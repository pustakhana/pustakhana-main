import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, MapPin, Sparkles, Package, Plus, UserIcon, Search, 
  CheckCircle2, Filter, CreditCard, ShieldCheck, RotateCcw, ChevronDown 
} from 'lucide-react';
import { cn } from '../lib/utils';

const PageWrapper = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">{title}</h1>
      </div>
      <div className="prose prose-slate max-w-none">
        {children}
      </div>
    </motion.div>
  </div>
);

export const AboutUsPage = () => (
  <PageWrapper title="About Us" icon={<BookOpen className="w-6 h-6 text-brand" />}>
    <p className="text-slate-600 text-lg leading-relaxed">
      Pustakkhana is built for readers who believe books should be affordable and accessible to everyone. Often called the “Robinhood of books,” we aim to bring you the best titles at unbeatable prices. Whether you love fiction, self-help, or academic reads, we make sure great books reach you without burning your pocket.
    </p>
  </PageWrapper>
);

export const ContactUsPage = () => (
  <PageWrapper title="Contact Us" icon={<MapPin className="w-6 h-6 text-brand" />}>
    <div className="space-y-6">
      <p className="text-slate-600 text-lg">Have questions or need help? We’re here for you.</p>
      <div className="grid gap-6">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">📞</div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Call Us</p>
            <p className="text-xl font-bold text-slate-900">8767466660</p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">💬</div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp</p>
            <p className="text-xl font-bold text-slate-900">8767466660</p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">📧</div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Us</p>
            <p className="text-xl font-bold text-slate-900">pustakhana@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
);

export const BlogsPage = () => (
  <PageWrapper title="Blogs" icon={<Sparkles className="w-6 h-6 text-brand" />}>
    <p className="text-slate-600 text-lg leading-relaxed">
      Explore our blog section for book recommendations, reading tips, trending titles, and literary insights. Stay updated with everything happening in the world of books.
    </p>
    <div className="mt-12 grid gap-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="group cursor-pointer">
          <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden">
            <img 
              src={`https://picsum.photos/seed/blog${i}/800/450`} 
              alt="Blog post" 
              className="w-full h-full object-cover transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand transition-colors">Coming Soon: Literary Insights {i}</h3>
          <p className="text-slate-500 text-sm">Stay tuned for our upcoming articles and book reviews.</p>
        </div>
      ))}
    </div>
  </PageWrapper>
);

export const WholesalePage = () => (
  <PageWrapper title="Wholesale" icon={<Package className="w-6 h-6 text-brand" />}>
    <p className="text-slate-600 text-lg leading-relaxed">
      Bulk orders for schools, offices, and events. Get special pricing and dedicated support for your large-scale book requirements.
    </p>
    <div className="mt-8 p-8 rounded-3xl bg-brand/5 border border-brand/10">
      <h3 className="text-xl font-bold text-brand mb-4">Wholesale Benefits</h3>
      <ul className="space-y-3">
        {['Special Bulk Pricing', 'Dedicated Account Manager', 'Customized Book Lists', 'Priority Shipping'].map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </PageWrapper>
);

export const SellWithUsPage = () => (
  <PageWrapper title="Sell with Us" icon={<Plus className="w-6 h-6 text-brand" />}>
    <p className="text-slate-600 text-lg leading-relaxed">
      Become a partner and sell your books on our platform. Reach thousands of readers and grow your business with Pustakkhana.
    </p>
    <div className="mt-8 grid md:grid-cols-2 gap-6">
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-2">Individual Sellers</h4>
        <p className="text-sm text-slate-500">Sell your pre-loved books easily to other readers.</p>
      </div>
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-2">Publishers & Stores</h4>
        <p className="text-sm text-slate-500">List your catalog and reach a wider audience across the country.</p>
      </div>
    </div>
  </PageWrapper>
);

export const CareerPage = () => (
  <PageWrapper title="Career" icon={<UserIcon className="w-6 h-6 text-brand" />}>
    <p className="text-slate-600 text-lg leading-relaxed">
      Join our team and help us build the future of book retail. We're always looking for passionate people to join our mission.
    </p>
    <div className="mt-12 text-center p-12 rounded-3xl bg-slate-50 border border-dashed border-slate-200">
      <p className="text-slate-400 font-medium">No open positions at the moment. Check back later!</p>
    </div>
  </PageWrapper>
);

const FAQItem = ({ question, children }: { question: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-slate-900 text-lg">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 pt-2 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const FAQsPage = () => (
  <PageWrapper title="FAQ" icon={<Search className="w-6 h-6 text-brand" />}>
    <div className="space-y-12">
      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          My Account
        </h3>
        <div className="space-y-2">
          <FAQItem question="What does “my account” mean? How can I modify my selective information?">
            <p>Modifying your Pustakkhana account is quite simple. You can see your orders at any time via “My Account”. My Account lets you check all your transactions done on Pustakkhana.</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Handle/modify your personalized information such as address, contact information, e-mail IDs</li>
              <li>Modify your password</li>
              <li>Track your order status at any time</li>
            </ul>
          </FAQItem>
          <FAQItem question="How can I confirm if my order has been accepted?">
            <p>You will receive an email from us confirming your order details which will contain an Order ID (for example: PK123456), the list of product(s) ordered, and the expected date of delivery.</p>
            <p className="mt-4">You will be sent additional communication before your order is shipped. This mail will contain the Order ID along with the tracking details which you can use to see where your shipment is at present.</p>
          </FAQItem>
          <FAQItem question="How can I purchase an item which is currently ‘out of stock’?">
            <p>Regrettably, the items that are currently out of stock will not be available for sale. Kindly use the “Notify Me” feature, which will help notify you as soon as the required item is available with us.</p>
          </FAQItem>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          Purchasing
        </h3>
        <div className="space-y-2">
          <FAQItem question="Do I need to have an account on Pustakkhana for shopping?">
            <p>Yes, it is recommended to have your own account on the website as it helps you experience an individualized shopping experience, including suggestions, faster checkout procedure, and a personal wishlist. You will also be able to rate and review the items.</p>
          </FAQItem>
          <FAQItem question="Can I place a bulk order on Pustakkhana?">
            <p>Yes, you can place a bulk order by contacting us at <a href="mailto:pustakhana@gmail.com" className="text-brand font-bold hover:underline">pustakhana@gmail.com</a> detailing ISBN/title, quantity, and delivery location.</p>
          </FAQItem>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          Payment Methods
        </h3>
        <div className="space-y-2">
          <FAQItem question="How can I make payments for purchases on Pustakkhana?">
            <p>Pustakkhana accepts multiple payment modes for the convenience of customers. Customers can make payments online, assured that our trusted payment gateway partners use secure encryption technology to protect transaction details against any theft or infringement.</p>
            <p className="mt-4">Customers can choose options such as internet banking, credit/debit cards (Visa, MasterCard, Maestro, American Express), etc.</p>
          </FAQItem>
          <FAQItem question="When I buy from Pustakkhana, do I need to worry about hidden charges like duty or taxes?">
            <p>No, customers do not have to worry about any hidden charges. The prices displayed on the website are final and fully inclusive. You pay exactly what you see.</p>
          </FAQItem>
          <FAQItem question="How can I make payment using my credit or debit card?">
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-slate-900 mb-2">Credit Cards</h5>
                <p>Pustakkhana accepts Visa, MasterCard, Maestro, and American Express credit cards. To pay, enter your card details, expiry date, and CVV number. You will then be redirected to your bank’s secure page to complete the transaction.</p>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-2">Debit Cards</h5>
                <p>Pustakkhana accepts Visa, MasterCard, Maestro, and American Express debit cards. Enter your card details, expiry date (optional for Maestro), and CVV. Then complete the payment through your bank’s secure authentication process.</p>
              </div>
            </div>
          </FAQItem>
          <FAQItem question="Is it safe to use my credit/debit card on Pustakkhana?">
            <p>All online transactions on Pustakkhana are secured with high-level encryption technology. Payments are verified by banks using secure systems like OTP and 3D Secure for added protection.</p>
          </FAQItem>
          <FAQItem question="What does 3D Secure password mean?">
            <p>3D Secure is an added security layer by Visa and MasterCard that protects online transactions through identity verification.</p>
          </FAQItem>
          <FAQItem question="How can I obtain a 3D Secure password?">
            <p>You can register for it through your bank’s website or by contacting your bank.</p>
          </FAQItem>
          <FAQItem question="Can I pay using mobile?">
            <p>Yes, you can make payments via mobile using cards or internet banking. Pustakkhana ensures secure encrypted transactions on mobile as well.</p>
          </FAQItem>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          Status of Your Order
        </h3>
        <div className="space-y-2">
          <FAQItem question="How can I track my order?">
            <p>Visit the “My Account” section → “My Orders” to check your order status.</p>
            <p className="mt-4">Click on the order number to see detailed status.</p>
          </FAQItem>
          <FAQItem question="What do different order statuses mean?">
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="font-bold">Pending Authorization:</span> Awaiting payment confirmation</li>
              <li><span className="font-bold">Authorized/Processing:</span> Payment received, order being prepared</li>
              <li><span className="font-bold">Shipped:</span> Order dispatched</li>
              <li><span className="font-bold">Cancelled:</span> Order cancelled</li>
            </ul>
          </FAQItem>
          <FAQItem question="How can I cancel my order?">
            <p>You can cancel your order before it is shipped by contacting customer support with your order details.</p>
          </FAQItem>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          Shipping Process
        </h3>
        <div className="space-y-2">
          <FAQItem question="What are the delivery charges?">
            <p>Delivery charges vary depending on your location and order.</p>
          </FAQItem>
          <FAQItem question="Are there any hidden costs?">
            <p>No, there are no hidden costs. Prices shown are final.</p>
          </FAQItem>
          <FAQItem question="When will my order be delivered?">
            <p>Delivery will be made within the time mentioned on the product page. Working days exclude national holidays.</p>
          </FAQItem>
          <FAQItem question="Why can’t I receive delivery in my area?">
            <p>Possible reasons:</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Courier service not available</li>
              <li>Delivery restrictions in your region</li>
              <li>Remote location limitations</li>
            </ul>
          </FAQItem>
          <FAQItem question="How can I set up pickup for return?">
            <ul className="list-disc pl-5 space-y-2">
              <li>Contact Pustakkhana support</li>
              <li>Our team will guide you</li>
              <li>Courier pickup will be arranged</li>
              <li>If not available, you can ship it back (cost reimbursed)</li>
            </ul>
          </FAQItem>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          Courier Service
        </h3>
        <div className="space-y-2">
          <FAQItem question="How does delivery work?">
            <p>We use trusted courier services. You will receive a tracking ID to monitor your shipment.</p>
          </FAQItem>
          <FAQItem question="How are products packaged?">
            <p>Products are packed securely using waterproof wrapping and bubble wrap (for fragile items).</p>
          </FAQItem>
          <FAQItem question="How can I track my shipment?">
            <p>Use the tracking ID provided to track your order via courier website or your Pustakkhana account.</p>
          </FAQItem>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-brand rounded-full" />
          Return & Cancellation Policy
        </h3>
        <div className="space-y-2">
          <FAQItem question="What is the return policy?">
            <p>Products are 100% genuine. If there is an issue, we offer easy returns for damaged products.</p>
          </FAQItem>
          <FAQItem question="Do you offer free replacement?">
            <p>Yes, replacement is free for damaged or incorrect products.</p>
          </FAQItem>
          <FAQItem question="How to return a product?">
            <ul className="list-disc pl-5 space-y-2">
              <li>Contact support</li>
              <li>Wait for confirmation</li>
              <li>Return product in original condition with packaging and bill</li>
            </ul>
          </FAQItem>
          <FAQItem question="Important Notes">
            <ul className="list-disc pl-5 space-y-2">
              <li>No extra charges for returns/replacement</li>
              <li>Return request within specified time</li>
              <li>Refund if product is out of stock</li>
              <li>Replacement depends on stock availability</li>
            </ul>
          </FAQItem>
          <FAQItem question="What is pickup process?">
            <p>We arrange pickup for most locations. If unavailable, you can ship the product back and cost will be reimbursed.</p>
          </FAQItem>
          <FAQItem question="When will I get replacement?">
            <p>Replacement is processed after pickup or once product is received by seller.</p>
          </FAQItem>
          <FAQItem question="Do I need to return free gifts?">
            <p>Yes, all items including free gifts must be returned.</p>
          </FAQItem>
          <FAQItem question="Can I cancel return request?">
            <p>Yes, contact support immediately to cancel.</p>
          </FAQItem>
          <FAQItem question="Can I return part of my order?">
            <p>Yes, partial returns are allowed.</p>
          </FAQItem>
          <FAQItem question="When will I get refund?">
            <p>Refunds are processed after verification. It may take 7–10 business days depending on your bank.</p>
          </FAQItem>
          <FAQItem question="Why is my refund delayed?">
            <p>Sometimes banks take extra time. If delayed, contact us and we will assist you.</p>
          </FAQItem>
          <FAQItem question="How can I cancel my order?">
            <ul className="list-disc pl-5 space-y-2">
              <li>Login → My Orders</li>
              <li>Select item → Cancel</li>
              <li>Choose reason and confirm</li>
            </ul>
          </FAQItem>
          <FAQItem question="Why is cancel option disabled?">
            <ul className="list-disc pl-5 space-y-2">
              <li>Order already shipped</li>
              <li>Product is non-refundable</li>
            </ul>
          </FAQItem>
          <FAQItem question="How long does cancellation take?">
            <ul className="list-disc pl-5 space-y-2">
              <li>Up to 2 days for processing</li>
              <li>Refund initiated after cancellation</li>
            </ul>
          </FAQItem>
          <FAQItem question="What are refund modes?">
            <p>Refund is processed back to the original payment method.</p>
          </FAQItem>
        </div>
      </section>
    </div>
  </PageWrapper>
);

export const PrivacyPolicyPage = () => (
  <PageWrapper title="Privacy Policy" icon={<CheckCircle2 className="w-6 h-6 text-brand" />}>
    <div className="space-y-6 text-slate-600 leading-relaxed">
      <p>At Pustakkhana, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
      <h4 className="font-bold text-slate-900">1. Information Collection</h4>
      <p>We collect information you provide when creating an account, placing an order, or contacting us.</p>
      <h4 className="font-bold text-slate-900">2. Use of Information</h4>
      <p>Your data is used to process orders, improve our services, and communicate with you about your account or promotions.</p>
      <h4 className="font-bold text-slate-900">3. Data Security</h4>
      <p>We implement industry-standard security measures to protect your data from unauthorized access.</p>
    </div>
  </PageWrapper>
);

export const TermsConditionsPage = () => (
  <PageWrapper title="Terms & Conditions" icon={<Filter className="w-6 h-6 text-brand" />}>
    <div className="space-y-8 text-slate-600 leading-relaxed">
      <div>
        <p className="font-bold italic text-slate-900 underline mb-4">Terms & Conditions – Pustakkhana</p>
        <p>
          These Terms & Conditions apply to your use of the website Pustakkhana. By accessing our website through a computer, mobile device, or application, you agree to be bound by these terms.
        </p>
        <p>
          These terms define the relationship between you and Pustakkhana, including the conditions under which we provide access to our platform and sell products. If you do not agree with these terms, please do not use our website or make any purchases.
        </p>
        <p>
          Nothing in these Terms affects your statutory rights as a consumer under applicable laws.
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 italic">*1. Your Account & Profile*</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must complete registration before purchasing products from our website.</li>
          <li>You can only register if your account has not been previously suspended or banned by Pustakkhana.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>In case of suspicious activity or unauthorized access, you must notify us immediately.</li>
          <li>By registering, you confirm that all provided information is accurate and up to date.</li>
          <li>You agree to update your email, contact number, or address whenever necessary.</li>
          <li>Registration and browsing are free; however, you must pay for products, applicable taxes, and shipping charges.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 italic">*2. Orders & Payments*</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>While placing an order, we collect personal details such as name, address, contact details, and payment information. Please refer to our Privacy Policy for how this data is used.</li>
          <li>Payments can be made via accepted methods such as debit/credit cards, UPI, or other available options on our platform.</li>
          <li>Orders are subject to product availability.</li>
          <li>If a product is unavailable, we may offer a replacement or provide a full refund.</li>
          <li>All prices are listed in INR and are subject to change without prior notice.</li>
          <li>In case of pricing errors, we reserve the right to cancel the order or confirm it at the corrected price.</li>
          <li>If payment authorization fails, your order may be cancelled.</li>
          <li>Customers are responsible for tracking their orders.</li>
          <li>We reserve the right to cancel or limit orders (for example, multiple quantities of the same product).</li>
          <li>If you are under 18, you must use the website under the supervision of a parent or guardian.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 italic">*3. Cancellations, Returns & Refunds*</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>Order cancellation requests must be made as soon as possible. Orders already shipped may not be cancelled.</li>
          <li>If you receive a damaged or incorrect product, notify us within 72 hours of delivery.</li>
          <li>Refunds or replacements will be processed after verification.</li>
          <li>No refunds will be issued if the product shows signs of use or damage caused after delivery.</li>
          <li>Certain items (such as pre-orders or special sale items) may not be eligible for cancellation or refund.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 italic">*4. Delivery Policy*</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>Deliveries are carried out through third-party courier partners.</li>
          <li>Estimated delivery time: 
            <ul className="list-none pl-4 mt-1">
              <li>*1.* Domestic: 2-6 working days</li>
              <li>*2.* International: Up to 16 working days</li>
            </ul>
          </li>
          <li>Delivery timelines may vary depending on location and availability.</li>
          <li>Once the product is delivered and accepted, ownership transfers to the customer.</li>
          <li>We are not responsible for any damage or loss after successful delivery.</li>
          <li>If you are unavailable, delivery may be accepted by another person at your address.</li>
          <li>If delivery fails, we will attempt to reschedule.</li>
          <li>Delivery is made at the doorstep only.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 italic">*5. Limitation of Liability*</h4>
        <p>Pustakkhana shall not be liable for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Payment failures due to banking issues</li>
          <li>Delays caused by courier partners</li>
          <li>Unauthorized access to your account due to negligence</li>
          <li>Any indirect or consequential losses</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 italic">*6. Changes to Terms*</h4>
        <p>We reserve the right to update or modify these Terms & Conditions at any time without prior notice. Continued use of the website implies acceptance of the updated terms.</p>
      </div>
    </div>
  </PageWrapper>
);

export const SafeSecureShoppingPage = () => (
  <PageWrapper title="Safe & Secure Shopping" icon={<ShieldCheck className="w-6 h-6 text-brand" />}>
    <div className="space-y-8 text-slate-600 leading-relaxed">
      <section>
        <h4 className="font-bold text-slate-900 italic">1. Is it safe to use my credit/debit card?</h4>
        <div className="space-y-4">
          <p>Yes, shopping on Pustakkhana is completely safe and secure. All payments made on our website are processed through trusted and secure payment gateways.</p>
          <p>Your payment details are encrypted using advanced security protocols, ensuring that your card information remains private and protected while being transmitted over the internet.</p>
          <p>For added security, you may be required to enter your CVV (Card Verification Value) or complete OTP verification, ensuring that only authorized users can complete transactions.</p>
          <p>We continuously work with reliable payment partners to provide a safe, smooth, and secure shopping experience for all our customers.</p>
        </div>
      </section>

      <section>
        <h4 className="font-bold text-slate-900 italic">2. Does Pustakkhana store my card or bank details?</h4>
        <div className="space-y-4">
          <p>No, Pustakkhana does NOT store your credit/debit card or bank account details.</p>
          <p>All transactions are processed securely through third-party payment gateways. Your financial information is handled directly by these gateways and never stored on our servers.</p>
        </div>
      </section>

      <section className="bg-brand/5 p-6 rounded-2xl border border-brand/10">
        <h4 className="font-bold text-brand mb-2">Your Safety, Our Priority</h4>
        <p>We are committed to maintaining the highest standards of online security so that you can shop with confidence. Your privacy and protection are always our top priority.</p>
      </section>
    </div>
  </PageWrapper>
);

export const ReturnsPage = () => (
  <PageWrapper title="Returns" icon={<RotateCcw className="w-6 h-6 text-brand" />}>
    <div className="space-y-8 text-slate-600 leading-relaxed">
      <p>At Pustakkhana, we strive to ensure that all products reach you in perfect condition through careful packaging and quality checks. However, if you happen to receive a faulty or damaged product, please follow the steps below to initiate a return.</p>
      
      <section>
        <h4 className="font-bold text-slate-900 mb-4">Return Process</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>If any product is received in a damaged or faulty condition, kindly email or WhatsApp us clear images of the damaged product and packaging within 7 days of delivery.</li>
          <li>Upon receiving and verifying the details, we will initiate the process for replacement or return.</li>
          <li>*Please note:* Only refunds will be processed for valid return claims.</li>
          <li>If the item is found eligible for a return, the refund will be credited within 7–10 business days.</li>
        </ul>
      </section>

      <section>
        <h4 className="font-bold text-slate-900 mb-4">Important Notes</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>Images of the product and packaging are mandatory for return verification</li>
          <li>Requests after 7 days of delivery may not be accepted</li>
          <li>Refunds will be processed only after verification</li>
        </ul>
      </section>
    </div>
  </PageWrapper>
);
