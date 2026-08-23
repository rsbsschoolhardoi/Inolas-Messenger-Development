const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUI = `                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Password</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}`;

const newUI = `                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Password</label>
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}`;

if (code.includes(oldUI)) {
  code = code.replace(oldUI, newUI);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched UI');
} else {
  console.log('could not find old UI');
}
