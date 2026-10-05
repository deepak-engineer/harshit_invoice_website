const fs = require('fs');

const filePath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\frontend\\src\\pages\\Login.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
const stateVariables = `
  const [email, setEmail] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [isResending, setIsResending] = useState(false);
`;
content = content.replace(/const \[phone, setPhone\] = useState\(''\);/, "const [phone, setPhone] = useState('');" + stateVariables);

// 2. Remove photo check in handleSignUp and update signup API call
const handleSignUpRegex = /const handleSignUp = async \(e\) => \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};\s*/;
const newHandleSignUp = `const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
        const res = await api.post('/employee-signup', { name: \`\${firstName} \${lastName}\`.trim(), phone, email, password });
        if (res.data.requires_otp) {
            setTempUserId(res.data.emp_id);
            setSuccess(res.data.message);
            setShowOtpScreen(true);
        } else {
            setSuccess(res.data.message);
            setIsSignUp(false);
            setUsername(res.data.username);
            setPassword('');
            setFirstName('');
            setLastName('');
            setPhone('');
            setEmail('');
        }
    } catch (err) {
        setError(err.response?.data?.error || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setIsLoading(true);
      try {
          const res = await api.post('/verify-email-otp', { emp_id: tempUserId, otp });
          setSuccess(res.data.message);
          setShowOtpScreen(false);
          setIsSignUp(false);
          setPassword('');
          setFirstName('');
          setLastName('');
          setPhone('');
          setEmail('');
          setOtp('');
      } catch (err) {
          setError(err.response?.data?.error || 'Verification failed');
      } finally {
          setIsLoading(false);
      }
  };

  const handleResendOtp = async () => {
      setError('');
      setSuccess('');
      setIsResending(true);
      try {
          const res = await api.post('/resend-email-otp', { emp_id: tempUserId });
          setSuccess(res.data.message);
      } catch (err) {
          setError(err.response?.data?.error || 'Failed to resend OTP');
      } finally {
          setIsResending(false);
      }
  };
`;
content = content.replace(handleSignUpRegex, newHandleSignUp);

// 3. Add OTP screen rendering in JSX
const formStartRegex = /<form onSubmit=\{isSignUp \? handleSignUp : handleLogin\} className="space-y-6">/;
const newFormStart = `{showOtpScreen ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Enter Verification Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800 tracking-widest font-bold text-center"
                        placeholder="000000"
                        maxLength="6"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <RefreshCcw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify Email'
                    )}
                  </button>
                  <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                        {isResending ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>
              </form>
            ) : (
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">`;
content = content.replace(formStartRegex, newFormStart);

// 4. Close the conditional render for showOtpScreen
const formEndRegex = /<\/form>\s*<\/div>\s*<\/div>\s*<\/div>/;
const newFormEnd = `</form>
            )}
          </div>
        </div>
      </div>`;
content = content.replace(formEndRegex, newFormEnd);

// 5. Add email input to the signup form
const phoneInputBlock = /<div>\s*<label className="block text-sm font-medium text-slate-700 mb-2">Phone Number<\/label>[\s\S]*?<\/div>\s*<\/div>/;
const emailInputHtml = `
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>`;
content = content.replace(phoneInputBlock, match => match + emailInputHtml);

// Fix title display for OTP screen
const titleRegex = /<h1 className="text-3xl font-bold text-slate-800 mb-2">\s*\{isSignUp \? 'Create Account' : 'Welcome Back'\}\s*<\/h1>/;
const newTitle = `<h1 className="text-3xl font-bold text-slate-800 mb-2">
                  {showOtpScreen ? 'Verify Email' : (isSignUp ? 'Create Account' : 'Welcome Back')}
              </h1>`;
content = content.replace(titleRegex, newTitle);

const subtitleRegex = /<p className="text-slate-500">\s*\{isSignUp \? 'Sign up as a new employee' : 'Sign in to manage your invoices'\}\s*<\/p>/;
const newSubtitle = `<p className="text-slate-500">
                  {showOtpScreen ? 'Check your email for the verification code' : (isSignUp ? 'Sign up as a new employee' : 'Sign in to manage your invoices')}
              </p>`;
content = content.replace(subtitleRegex, newSubtitle);

// Also remove the "Already have an account?" toggle if in OTP screen
const toggleRegex = /<button\s*type="button"\s*onClick=\{\(\) => \{\s*setIsSignUp\(!isSignUp\);\s*setError\(''\);\s*setSuccess\(''\);\s*if \(isSignUp\) setRole\('employee'\); \/\/ reset role to employee when going back to sign in\s*\}\}\s*className="text-sm font-semibold text-primary hover:text-primary\/80 transition-colors"\s*>\s*\{isSignUp \? 'Already have an account\? Sign In' : 'New employee\? Sign Up here'\}\s*<\/button>/;
const newToggle = `{!showOtpScreen && (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
                if (isSignUp) setRole('employee'); 
              }}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'New employee? Sign Up here'}
            </button>
          )}`;
content = content.replace(toggleRegex, newToggle);


fs.writeFileSync('c:\\xampp\\htdocs\\harshit_invoice_website\\frontend\\src\\pages\\Login.jsx', content, 'utf8');
console.log("Login page refactoring complete again!");
