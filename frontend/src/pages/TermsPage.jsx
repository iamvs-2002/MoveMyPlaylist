import React from 'react'
import { FileText, Heart, Shield, Terminal } from 'lucide-react'

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] relative pt-32 pb-24 overflow-hidden px-4 sm:px-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8 shadow-glass">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-widest text-primary uppercase text-white/70">Terms of Service</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-display font-black text-white mb-6 tracking-tight leading-[1.1]">
            Clear, honest, and <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-white/80">simple rules.</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
            MoveMyPlaylist is an open-source project. By using this service, you agree to these simple principles.
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-glass space-y-8 animate-slide-up">
          <div className="prose prose-invert max-w-none space-y-8 font-light text-white/60">
            <section className="space-y-4">
              <h2 className="text-3xl font-display font-bold text-white">Your Responsibility</h2>
              <p className="text-lg leading-relaxed">
                By providing your own API credentials (BYOK), you acknowledge that you are using this tool under your own developer account terms with Spotify and Google/YouTube. You are responsible for ensuring your keys are kept secure and aren't used for malicious purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-display font-bold text-white">Acceptable Use</h2>
              <ul className="list-disc ml-6 space-y-3 font-light">
                <li>You may not use this tool for commercial or illegal purposes.</li>
                <li>You may not use this tool to systematically scrape, crawl, or harvest platform data.</li>
                <li>You must respect the terms and conditions of the music platforms you are connecting.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-display font-bold text-white">Open Source License</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm leading-relaxed">
                MoveMyPlaylist is licensed under the MIT License. You are free to fork, modify, and distribute the code, provided that the original copyright notice and this permission notice are included in all copies or substantial portions of the software.
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-display font-bold text-white">Warranty & Liability</h2>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-100 flex items-start gap-4">
                <Shield className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                <p>
                  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.
                </p>
              </div>
              <p>
                In simpler terms: While we strive for 100% reliability, we are not responsible for any issues within your Spotify/YouTube accounts or if Google/Spotify choose to rotate keys or change their API policies.
              </p>
            </section>

            <div className="pt-10 border-t border-white/10 text-center">
              <div className="flex justify-center items-center space-x-2 text-primary font-bold mb-4">
                <Heart className="w-4 h-4 fill-primary" />
                <span>Made for the community</span>
              </div>
              <p className="text-white/30 text-sm">Last Updated: March 2026</p>
              <p className="text-white/30 text-sm mt-2">Questions? Contact us at: <a href="mailto:movemyplaylist.online@gmail.com" className="text-white/60 hover:text-white underline">movemyplaylist.online@gmail.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
