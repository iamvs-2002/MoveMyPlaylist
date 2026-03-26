import React, { useState } from 'react'
import { ChevronDown, HelpCircle, Shield, Key, AlertTriangle, Zap, Search } from 'lucide-react'

const FAQItem = ({ question, answer, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`group transition-all duration-500 rounded-3xl border ${isOpen ? 'bg-white/[0.05] border-primary/30' : 'bg-white/[0.02] border-white/10 hover:border-white/20'} overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-6 sm:px-8 flex items-center justify-between text-left gap-4"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-colors duration-500 ${isOpen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
            <Icon className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <span className={`text-lg sm:text-xl font-display font-bold transition-colors duration-300 ${isOpen ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
            {question}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform duration-500 text-white/30 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="px-6 pb-8 sm:px-24 text-white/50 leading-relaxed font-light text-base sm:text-lg border-t border-white/5 pt-6">
          {answer}
        </div>
      </div>
    </div>
  )
}

const FAQPage = () => {
  const faqs = [
    {
      icon: AlertTriangle,
      question: "Why am I getting 'Error 403: access_denied' during login?",
      answer: (
        <div className="space-y-4">
          <p>
            This is the most common issue for new BYOK (Bring Your Own Key) users. Since your Google Cloud Project is in <strong>Testing Mode</strong>, Google restricts access to approved accounts.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 space-y-3">
            <p className="font-bold text-primary">How to fix it:</p>
            <ol className="list-decimal ml-4 space-y-2">
              <li>Log in to your <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Google Cloud Console</a>.</li>
              <li>Go to <strong>APIs & Services</strong> &gt; <strong>OAuth consent screen</strong>.</li>
              <li>Scroll down to <strong>Test users</strong>.</li>
              <li>Click <strong>+ ADD USERS</strong> and enter the email address you are trying to use for login.</li>
              <li>Save and try again—it will work immediately!</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      icon: Key,
      question: "What is BYOK (Bring Your Own Key)?",
      answer: "BYOK stands for Bring Your Own Key. Instead of using a shared, global API key that frequently hits rate limits, MoveMyPlaylist allows you to provide your own API credentials. This ensures 100% privacy (your data never passes through a centralized server) and gives you a dedicated quota for lightning-fast transfers."
    },
    {
      icon: Search,
      question: "Why do I need both a Client ID and an API Key for YouTube?",
      answer: "Google separates authorization from indexing. The OAuth Client ID manages your account permissions (creating playlists), while the API Key is required by Google to allow the search functionality that finds your songs on the platform. Both are free to generate."
    },
    {
      icon: Shield,
      question: "Is MoveMyPlaylist secure?",
      answer: "Absolutely. We are an open-source project. We do not store your API keys, your playlist names, or your personally identifiable information on our servers. Your credentials are encrypted in your browser's session and are wiped as soon as your session ends."
    },
    {
      icon: Zap,
      question: "How fast is the transfer process?",
      answer: "On average, a 100-song playlist takes under 3 minutes. Our 'Smart Search' algorithm uses artist-batching to minimize API requests, making it significantly faster and more stable than traditional one-by-one matching tools."
    },
    {
      icon: HelpCircle,
      question: "Is there a limit on how many songs I can transfer?",
      answer: "The only limit is your platform's quota. By default, Google provides 10,000 units per day for free, which is enough to transfer approximately 3,000 to 5,000 songs daily."
    }
  ]

  return (
    <div className="min-h-screen bg-[#050505] relative pt-32 pb-24 overflow-hidden px-4 sm:px-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8 shadow-glass">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">Frequently Asked Questions</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-display font-black text-white mb-6 tracking-tight leading-[1.1]">
            Everything you need <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">to know.</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
            Stuck on something? We've gathered all the most common questions and technical fixes right here.
          </p>
        </div>

        <div className="space-y-6 animate-slide-up">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 p-8 sm:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 text-center shadow-glass relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <h2 className="text-2xl font-display font-bold text-white mb-4 relative z-10">Still have questions?</h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto relative z-10">
            If you can't find what you're looking for, our community and support team are always ready to help.
          </p>
          <a
            href="mailto:movemyplaylist.online@gmail.com"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all duration-300 relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

export default FAQPage
