import React from 'react'
import { Shield, Eye, Lock, Database } from 'lucide-react'

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] relative pt-32 pb-24 overflow-hidden px-4 sm:px-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8 shadow-glass">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-widest text-primary uppercase text-white/70">Privacy Commitment</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-display font-black text-white mb-6 tracking-tight leading-[1.1]">
            Transparency is our <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-white/80">core principle.</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
            MoveMyPlaylist is built on a "Privacy-First" BYOK architecture. This means your data remains yours, period.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 shadow-glass space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white">No Tracking</h3>
            <p className="text-white/50 leading-relaxed font-light">
              We do not use cookies for tracking, nor do we use third-party analytics scripts that profile your behavior. Our only statistics are anonymous and aggregated.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 shadow-glass space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white">No Storage</h3>
            <p className="text-white/50 leading-relaxed font-light">
              Your playlist names, song titles, and account metadata are never saved to our database. Every transfer occurs entirely within your active session.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-glass space-y-8 animate-slide-up">
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-3xl font-display font-bold text-white mb-4">BYOK & Credential Security</h2>
              <p className="text-white/60 text-lg leading-relaxed font-light">
                As a "Bring Your Own Key" (BYOK) application, MoveMyPlaylist requires you to provide your own API credentials. These credentials are encrypted and stored solely in your **active memory session**. Once you log out or close your browser, these credentials are wiped permanently. We have no backend access to your API keys.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Information We Collect</h2>
              <ul className="list-disc ml-6 text-white/50 space-y-3 font-light">
                <li><strong>Anonymous Statistics:</strong> We track total successful transfers, total tracks moved, and platform-to-platform popularity (e.g., Spotify to YouTube) to help us improve our matching algorithms.</li>
                <li><strong>Session Metadata:</strong> A temporary session ID is used to manage your current transfer progress. This is not linked to any personal identity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Open Source Integrity</h2>
              <p className="text-white/60 text-lg leading-relaxed font-light">
                Because we are open-source, you don't have to take our word for it. You can inspect every line of our backend code on <a href="https://github.com/iamvs-2002/movemyplaylist" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a> to verify exactly how we handle your data.
              </p>
            </section>

            <div className="pt-10 border-t border-white/10 text-center">
              <p className="text-white/30 text-sm">Last Updated: March 2026</p>
              <p className="text-white/30 text-sm mt-2">Questions? Contact us at: <a href="mailto:movemyplaylist.online@gmail.com" className="text-white/60 hover:text-white underline">movemyplaylist.online@gmail.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
