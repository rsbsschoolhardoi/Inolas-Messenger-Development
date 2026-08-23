const fs = require('fs');
const content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const startStr = `      {/* CORE ARCHITECTURAL FEATURES GRID */}`;
const endStr = `      </section>

      {/* SECURITY SPECIFICATIONS & LEGAL DOCUMENTATION */}`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newFeatures = `      {/* CORE ARCHITECTURAL FEATURES & CAPABILITIES */}
      <section id="features" className="py-24 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-3">
              Platform Capabilities
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-6">
              Engineered for absolute privacy and flawless communication.
            </h2>
            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Zenoa is not just another messaging app. It is a comprehensive suite of advanced communication tools built on a foundation of zero-knowledge cryptography, real-time edge synchronization, and uncompromising design.
            </p>
          </div>

          {/* Bento Grid Layout for Major Features */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
            
            {/* Feature 1: WebRTC Calling - Large Block */}
            <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 md:p-12 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Video className="w-48 h-48" />
              </div>
              <div className="relative z-10 max-w-lg">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-4">
                  High-Definition P2P WebRTC Calls
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                  Experience crystal-clear voice and video calls powered by direct Peer-to-Peer WebRTC connections. With dynamic resolution scaling (up to 720p HD), background noise suppression, and real-time camera switching, your conversations feel natural and completely private.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> End-to-end encrypted media streams
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Seamless front/rear camera flipping
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Integrated call duration & history logs
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Zero-Knowledge - Small Block */}
            <div className="md:col-span-4 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 transition-all hover:shadow-xl hover:shadow-rose-500/5">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-3">
                WebCrypto AES-256-GCM
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Native client-side payload obfuscation guarantees zero plain-text leaks. Even we cannot read your messages or access your media.
              </p>
            </div>

            {/* Feature 3: Cross-Platform Sync - Small Block */}
            <div className="md:col-span-4 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 transition-all hover:shadow-xl hover:shadow-sky-500/5">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-6">
                <MonitorSmartphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-3">
                Multi-Device Sync
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Access your encrypted message history flawlessly across mobile, tablet, and desktop browsers with sub-10ms real-time Firestore edge synchronization.
              </p>
            </div>

            {/* Feature 4: Media & Voice - Large Block */}
            <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 md:p-12 transition-all hover:shadow-xl hover:shadow-amber-500/5">
               <div className="absolute bottom-0 right-0 p-8 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Mic className="w-48 h-48" />
              </div>
              <div className="relative z-10 max-w-lg">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-4">
                  Rich Media & Voice Waveforms
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                  Share high-resolution images, documents, and expressive voice notes effortlessly. Our synthetic voice engine analyzes audio in real-time to generate beautiful, interactive waveforms that you can scrub and preview before sending.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Drag-and-drop file attachments
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Live audio frequency visualization
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Automatic media compression & encryption
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Advanced Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <Flame className="h-6 w-6 text-orange-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Atomic Memory Purge</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Global "Delete for Everyone" triggers an immediate atomic purge across databases and local IndexedDB caches.
              </p>
            </div>
            
            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <WifiOff className="h-6 w-6 text-neutral-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Offline Resilience</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Access your chat history and draft replies even when internet connection drops via aggressive local caching.
              </p>
            </div>

            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <KeyRound className="h-6 w-6 text-emerald-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Passwordless Entry</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Support for secure Magic Link email logins alongside highly-salted traditional credential authentication.
              </p>
            </div>

            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <Globe className="h-6 w-6 text-indigo-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Zero-Telemetry Policy</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Strict operational standard ensures no third-party tracking pixels, location harvesters, or invasive metrics.
              </p>
            </div>
          </div>

        </div>
      </section>

`;
  
  const updatedContent = content.substring(0, startIndex) + newFeatures + content.substring(endIndex);
  fs.writeFileSync('src/components/LandingPage.tsx', updatedContent);
  console.log('Successfully updated the features block.');
} else {
  console.log('Could not find the target strings.');
}
