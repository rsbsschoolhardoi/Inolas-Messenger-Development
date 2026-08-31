const fs = require('fs');
let code = fs.readFileSync('src/components/DeveloperPortal.tsx', 'utf8');

const newUI = `                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Service Account Username</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">@</span>
                          <input 
                            type="text" 
                            value={editBotUsername}
                            onChange={e => setEditBotUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                            placeholder="my_bot" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-xs font-mono outline-none text-zinc-100 focus:border-zinc-700"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">This will change the bot's username (Zenoa ID).</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Service Account Name</label>
                        <input 
                          type="text" 
                          value={editAppName}
                          onChange={e => setEditAppName(e.target.value)}
                          placeholder="My Awesome App" 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-700"
                        />
                      </div>
                    </div>`;

code = code.replace(
  '                  <div className="space-y-4">',
  newUI
);

fs.writeFileSync('src/components/DeveloperPortal.tsx', code);
