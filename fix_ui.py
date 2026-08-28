import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the glowing dot next to Zenoa in Chat Header
old_zenoa = """<h1 className="font-zenoa text-xl md:text-2xl font-bold tracking-[0.14em] uppercase text-slate-900 dark:text-white select-none transition-colors">
                      Zenoa
                    </h1>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-xs shadow-indigo-500/50"></span>"""
new_zenoa = """<h1 className="font-zenoa text-xl md:text-2xl font-bold tracking-[0.14em] uppercase text-slate-900 dark:text-white select-none transition-colors">
                      Zenoa
                    </h1>"""
content = content.replace(old_zenoa, new_zenoa)

# 2. Keep only Group Create button in Chat Header
old_header = """<div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-100/80 dark:bg-slate-800/50 transition-colors cursor-pointer"
                      title="Switch Theme"
                    >
                      {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
                    </button>
                    <button 
                      onClick={() => setActiveView('settings')}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-100/80 dark:bg-slate-800/50 transition-colors cursor-pointer"
                      title="Settings"
                    >
                      <Menu className="h-4 w-4" />
                    </button>
                    {/* Plus trigger to initiate conversation with custom user */}
                    <button onClick={() => setActiveView('search')} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer" title="Start new chat">
                      <Plus className="h-4 w-4" />
                    </button>
                    {/* New Group Button */}
                    <button 
                      onClick={() => {
                        setNewGroupPreselectedUser(null);
                        setShowNewGroupModal(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="New Group Chat"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>"""

new_header = """<div className="flex items-center gap-1.5">
                    {/* New Group Button */}
                    <button 
                      onClick={() => {
                        setNewGroupPreselectedUser(null);
                        setShowNewGroupModal(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="New Group Chat"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>"""
content = content.replace(old_header, new_header)

# 3. Profile Hamburger Menu -> go straight to Settings
old_menu = """<button
                  onClick={() => {
                    setShowProfileDrawer(true);
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer"
                  title="Menu"
                >"""
new_menu = """<button
                  onClick={() => {
                    setActiveView('settings');
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer"
                  title="Settings & Privacy"
                >"""
content = content.replace(old_menu, new_menu)

# 4. Remove the drawer code block (the whole Account Hub thing)
drawer_pattern = re.compile(r'\{\/\* Professional Sliding Hamburger Menu Drawer \*\/\}.*?<\/AnimatePresence>', re.DOTALL)
content = re.sub(drawer_pattern, '', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
