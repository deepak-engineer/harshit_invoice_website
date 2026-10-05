const fs = require('fs');

const frontendPath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\frontend\\src\\pages\\Login.jsx';
let frontendContent = fs.readFileSync(frontendPath, 'utf8');

// 1. Remove isSignUp state and related variables
frontendContent = frontendContent.replace(
    /const \[isSignUp, setIsSignUp\] = useState\(\(\) => \{[\s\S]*?\}\);\s*/,
    ""
);
frontendContent = frontendContent.replace(
    /useEffect\(\(\) => \{\s*sessionStorage.setItem\('isSignUp', isSignUp\);\s*\}, \[isSignUp\]\);\s*/,
    ""
);
frontendContent = frontendContent.replace(/const \[firstName, setFirstName\] = useState\(''\);\s*/, "");
frontendContent = frontendContent.replace(/const \[lastName, setLastName\] = useState\(''\);\s*/, "");

// 2. Modify handleLogin to call send-login-otp for employees
const handleLoginRegex = /const handleLogin = async \(e\) => \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/;
const newHandleLogin = `const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      if (role === 'employee') {
          const res = await api.post('/send-login-otp', { email: username });
          if (res.data.requires_otp) {
              setTempUserId(res.data.emp_id);
              setSuccess(res.data.message);
              setShowOtpScreen(true);
          }
      } else {
          const res = await api.post('/login', { username, password, role });
          if (res.data.role === 'admin') {
              if (res.data.is_super_admin) localStorage.setItem('is_super_admin', 'true');
              else localStorage.setItem('is_super_admin', 'false');
              navigate('/admin/dashboard');
          }
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many failed attempts. Please try again in 15 minutes.');
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.error || 'Account is inactive.');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials or email not found.');
      }
    } finally {
      setIsLoading(false);
    }
  };`;
frontendContent = frontendContent.replace(handleLoginRegex, newHandleLogin);

// 3. Update handleVerifyOtp to redirect to dashboard on success
const handleVerifyRegex = /const handleVerifyOtp = async \(e\) => \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/;
const newHandleVerify = `const handleVerifyOtp = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setIsLoading(true);
      try {
          const res = await api.post('/verify-login-otp', { emp_id: tempUserId, otp });
          if (res.data.success) {
              setSuccess('Login successful!');
              setTimeout(() => {
                  navigate('/employee/dashboard');
              }, 1000);
          }
      } catch (err) {
          setError(err.response?.data?.error || 'Verification failed');
      } finally {
          setIsLoading(false);
      }
  };`;
frontendContent = frontendContent.replace(handleVerifyRegex, newHandleVerify);

// 4. Remove handleSignUp entirely
frontendContent = frontendContent.replace(/const handleSignUp = async \(e\) => \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};\s*/, "");

// 5. Update JSX: Remove Signup form UI completely
const formContentRegex = /<form onSubmit=\{isSignUp \? handleSignUp : handleLogin\} className="space-y-6">[\s\S]*?<\/form>/;
const newFormContent = `<form onSubmit={handleLogin} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{role === 'employee' ? 'Email Address' : 'Username'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type={role === 'employee' ? "email" : "text"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                    placeholder={role === 'employee' ? "Enter your email" : "Enter username"}
                  />
                </div>
              </div>
              
              {role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  role === 'employee' ? 'Send OTP' : 'Sign In'
                )}
              </button>
            </form>`;
frontendContent = frontendContent.replace(formContentRegex, newFormContent);

// Update heading
frontendContent = frontendContent.replace(
    /\{showOtpScreen \? 'Verify Email' : \(isSignUp \? 'Create Account' : 'Welcome Back'\)\}/,
    "{showOtpScreen ? 'Verify Login' : 'Welcome Back'}"
);
frontendContent = frontendContent.replace(
    /\{showOtpScreen \? 'Check your email for the verification code' : \(isSignUp \? 'Sign up as a new employee' : 'Sign in to manage your invoices'\)\}/,
    "{showOtpScreen ? 'Check your email for the OTP code to login' : 'Sign in to manage your invoices'}"
);

// Remove the "Already have an account?" toggle
frontendContent = frontendContent.replace(
    /\{!showOtpScreen && \([\s\S]*?<\/button>\s*\)\}/,
    ""
);

fs.writeFileSync(frontendPath, frontendContent, 'utf8');
console.log("Frontend Login.jsx refactored for Passwordless Flow!");
