const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const target = '      {/* EDIT USER PROFILE & PFP MODAL */}';
const replacement = `      {/* USER DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-base font-black text-rose-500 uppercase tracking-wide flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Delete Account: @{userToDelete.username}</span>
                </h3>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                  Are you absolutely sure you want to <span className="text-rose-400 font-bold">PERMANENTLY DELETE</span> the account <span className="font-bold text-white">@{userToDelete.username}</span> ({userToDelete.display_name})?
                </p>
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-300 leading-relaxed space-y-1">
                  <p className="font-bold">⚠️ Critical Consequences:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono">
                    <li>Username <span className="text-white">@{userToDelete.username}</span> will be immediately freed up for anyone else to register.</li>
                    <li>The associated email address will be completely unbound and available for new account registration.</li>
                    <li>This operation is <span className="underline">irreversible</span>. All Firestore database references, profiles, and caches will be completely purged.</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteUserPermanently}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer border border-rose-500 shadow-md transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER PROFILE & PFP MODAL */}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
  console.log('Successfully inserted custom userToDelete confirmation modal!');
} else {
  console.log('Target not found!');
}
